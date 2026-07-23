import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { lstat, mkdir, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const NATIVE_SDK_VERSION = "0.5.4";
export const WINDOWS_TARGET = "windows";
export const WINDOWS_PACKAGE_EXECUTABLE = "creature-os-go-agent.exe";
export const WINDOWS_PACKAGE_EXECUTABLE_RELATIVE_PATH = path.join("bin", WINDOWS_PACKAGE_EXECUTABLE);
export const WINDOWS_PACKAGE_WINDOW_TITLE = "Creature OS - Go Agent";
export const DESKTOP_NATIVE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "apps", "desktop-native");
export const WINDOWS_PACKAGE_DIRECTORY = path.resolve(DESKTOP_NATIVE_ROOT, "package", WINDOWS_TARGET);

export interface WindowReadiness {
  readonly ready: boolean;
  readonly handle: string | null;
  readonly title: string | null;
  readonly responsive: boolean;
  readonly method: string;
}

export interface CleanupEvidence {
  readonly gracefulAttempted: boolean;
  readonly forcedTreeKillAttempted: boolean;
  readonly completed: boolean;
  readonly failure: string | null;
}

export interface LaunchEvidence {
  readonly expectedSdkVersion: string;
  readonly observedSdkVersion: string | null;
  readonly sdkVersionOutput: string;
  readonly target: string;
  readonly packageDirectory: string | null;
  readonly packageCreatedAt: string | null;
  readonly runId: string;
  readonly executablePath: string | null;
  readonly executableSha256: string | null;
  readonly readiness: WindowReadiness | null;
  readonly readinessElapsedMs: number | null;
  readonly cleanup: CleanupEvidence | null;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly result: "passed" | "failed";
  readonly failure: string | null;
}

export interface RunningProcess {
  readonly pid?: number;
  readonly exitCode: number | null;
  once(event: "error" | "exit", listener: (...args: readonly unknown[]) => void): unknown;
  kill(signal?: NodeJS.Signals | number): boolean;
}

export type ProcessLauncher = (executablePath: string) => RunningProcess;
export type WindowQuery = (pid: number) => Promise<WindowReadiness>;
export type ProcessTreeKiller = (pid: number) => Promise<void>;

export class LaunchSmokeError extends Error {
  constructor(readonly evidence: LaunchEvidence) {
    super(evidence.failure ?? "Desktop launch smoke failed");
  }
}

function isWithin(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

/**
 * Resolves the sole supported directory-package layout. Deliberately do not
 * search descendants: a stale or nested executable is not build evidence.
 */
export async function findPackagedExecutable(packageDirectory: string): Promise<string> {
  const requestedRoot = path.resolve(packageDirectory);
  let rootLink;
  try {
    rootLink = await lstat(requestedRoot);
  } catch {
    throw new Error(`Windows directory package is missing at ${requestedRoot}. Run the atomic verification command first.`);
  }
  if (rootLink.isSymbolicLink()) throw new Error(`Windows package directory must not be a symlink: ${requestedRoot}`);

  const packageRoot = await realpath(requestedRoot);
  const requestedExecutable = path.resolve(packageRoot, WINDOWS_PACKAGE_EXECUTABLE_RELATIVE_PATH);
  if (!isWithin(packageRoot, requestedExecutable)) throw new Error("Windows package executable escaped its package root.");

  let entry;
  let executableStats;
  try {
    entry = await lstat(requestedExecutable);
    executableStats = await stat(requestedExecutable);
  } catch {
    throw new Error(`Expected exact Windows package executable at ${requestedExecutable}.`);
  }
  if (entry.isSymbolicLink()) throw new Error(`Windows package executable must not be a symlink or reparse point: ${requestedExecutable}`);
  if (!executableStats.isFile() || executableStats.size === 0) {
    throw new Error(`Expected a nonempty regular executable file at ${requestedExecutable}.`);
  }

  const resolvedExecutable = await realpath(requestedExecutable);
  if (!isWithin(packageRoot, resolvedExecutable)) {
    throw new Error(`Windows package executable resolves outside its package root: ${requestedExecutable}`);
  }
  return resolvedExecutable;
}

export function parseNativeSdkVersion(output: string): string {
  const versions = [...output.matchAll(/(?:^|[^0-9])(\d+\.\d+\.\d+)(?![0-9])/g)].map((match) => match[1]);
  if (versions.length !== 1) throw new Error("Could not determine exactly one Vercel Native SDK version from the local CLI output.");
  return versions[0];
}

export async function sha256File(filePath: string): Promise<string> {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

function defaultLauncher(executablePath: string): RunningProcess {
  return spawn(executablePath, [], { detached: false, stdio: "ignore" });
}

function waitForExit(process: RunningProcess, timeoutMs: number): Promise<boolean> {
  if (process.exitCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    process.once("exit", () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

async function defaultWindowQuery(pid: number): Promise<WindowReadiness> {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "Add-Type -Namespace Native -Name User32 -MemberDefinition '[DllImport(\"user32.dll\", SetLastError=true)] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, IntPtr lParam, uint flags, uint timeout, out UIntPtr result);'",
    `$p = Get-Process -Id ${pid} -ErrorAction Stop`,
    "$handle = $p.MainWindowHandle",
    "$responsive = $false",
    "if ($handle -ne 0) { $result = [UIntPtr]::Zero; $responsive = [Native.User32]::SendMessageTimeout($handle, 0, [UIntPtr]::Zero, [IntPtr]::Zero, 2, 500, [ref]$result) -ne [IntPtr]::Zero }",
    "[pscustomobject]@{ ready = ($handle -ne 0 -and $responsive); handle = if ($handle -ne 0) { $handle.ToString() } else { $null }; title = $p.MainWindowTitle; responsive = $responsive; method = 'PowerShell Get-Process MainWindowHandle + user32 SendMessageTimeout' } | ConvertTo-Json -Compress",
  ].join("; ");
  return new Promise((resolve, reject) => {
    const query = spawn("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script], { windowsHide: true });
    let output = "";
    let errorOutput = "";
    query.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    query.stderr?.on("data", (chunk: Buffer) => { errorOutput += chunk.toString(); });
    const timer = setTimeout(() => {
      query.kill();
      reject(new Error("Timed out querying packaged window readiness."));
    }, 2_000);
    query.once("error", (error) => { clearTimeout(timer); reject(error); });
    query.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`Window readiness query failed: ${errorOutput.trim() || String(code)}`));
      try {
        resolve(JSON.parse(output) as WindowReadiness);
      } catch {
        reject(new Error("Window readiness query returned invalid data."));
      }
    });
  });
}

async function defaultProcessTreeKiller(pid: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const taskkill = spawn("taskkill.exe", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    const timer = setTimeout(() => { taskkill.kill(); reject(new Error("Timed out forcing the packaged process tree to exit.")); }, 5_000);
    taskkill.once("error", (error) => { clearTimeout(timer); reject(error); });
    taskkill.once("exit", (code) => {
      clearTimeout(timer);
      if (code === 0 || code === 128) resolve(); else reject(new Error(`taskkill exited with code ${String(code)}.`));
    });
  });
}

async function waitForReadyWindow(process: RunningProcess, queryWindow: WindowQuery, timeoutMs: number): Promise<{ readiness: WindowReadiness; elapsedMs: number }> {
  if (!process.pid) throw new Error("Packaged executable did not expose a process id.");
  const started = Date.now();
  let lastReadiness: WindowReadiness | null = null;
  while (Date.now() - started < timeoutMs) {
    if (process.exitCode !== null) throw new Error(`Packaged executable exited before a responsive top-level window was ready (exit code ${String(process.exitCode)}).`);
    lastReadiness = await queryWindow(process.pid);
    if (lastReadiness.ready && lastReadiness.responsive && lastReadiness.handle && lastReadiness.title === WINDOWS_PACKAGE_WINDOW_TITLE) {
      return { readiness: lastReadiness, elapsedMs: Date.now() - started };
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Packaged executable did not expose a responsive ${WINDOWS_PACKAGE_WINDOW_TITLE} top-level window within ${timeoutMs}ms${lastReadiness?.title ? ` (last title: ${lastReadiness.title})` : ""}.`);
}

async function cleanupProcess(process: RunningProcess, killTree: ProcessTreeKiller, timeoutMs: number): Promise<CleanupEvidence> {
  let gracefulAttempted = false;
  let forcedTreeKillAttempted = false;
  try {
    if (process.exitCode !== null) return { gracefulAttempted, forcedTreeKillAttempted, completed: true, failure: null };
    gracefulAttempted = true;
    process.kill("SIGTERM");
    if (await waitForExit(process, timeoutMs)) return { gracefulAttempted, forcedTreeKillAttempted, completed: true, failure: null };
    if (!process.pid) throw new Error("Cannot force-kill a packaged process without a process id.");
    forcedTreeKillAttempted = true;
    await killTree(process.pid);
    if (await waitForExit(process, timeoutMs)) return { gracefulAttempted, forcedTreeKillAttempted, completed: true, failure: null };
    throw new Error("Packaged process tree did not exit after forced termination.");
  } catch (error) {
    return { gracefulAttempted, forcedTreeKillAttempted, completed: false, failure: error instanceof Error ? error.message : String(error) };
  }
}

async function writeEvidence(evidencePath: string, evidence: LaunchEvidence): Promise<void> {
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

export async function runPackageLaunchSmoke(options: {
  readonly executablePath: string;
  readonly evidencePath: string;
  readonly expectedSdkVersion?: string;
  readonly observedSdkVersion?: string | null;
  readonly sdkVersionOutput?: string;
  readonly packageDirectory?: string;
  readonly packageCreatedAt?: string;
  readonly executableSha256?: string;
  readonly launch?: ProcessLauncher;
  readonly queryWindow?: WindowQuery;
  readonly killProcessTree?: ProcessTreeKiller;
  readonly readinessTimeoutMs?: number;
  readonly cleanupTimeoutMs?: number;
}): Promise<LaunchEvidence> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  let process: RunningProcess | undefined;
  let readiness: WindowReadiness | null = null;
  let readinessElapsedMs: number | null = null;
  let cleanup: CleanupEvidence | null = null;
  let failure: string | null = null;
  try {
    process = (options.launch ?? defaultLauncher)(options.executablePath);
    const window = await waitForReadyWindow(process, options.queryWindow ?? defaultWindowQuery, options.readinessTimeoutMs ?? 10_000);
    readiness = window.readiness;
    readinessElapsedMs = window.elapsedMs;
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  } finally {
    if (process) {
      cleanup = await cleanupProcess(process, options.killProcessTree ?? defaultProcessTreeKiller, options.cleanupTimeoutMs ?? 3_000);
      if (!cleanup.completed && !failure) failure = `Packaged process cleanup failed: ${cleanup.failure}`;
    }
  }
  const finished = Date.now();
  const evidence: LaunchEvidence = {
    expectedSdkVersion: options.expectedSdkVersion ?? NATIVE_SDK_VERSION,
    observedSdkVersion: options.observedSdkVersion ?? null,
    sdkVersionOutput: options.sdkVersionOutput ?? "not observed by standalone smoke",
    target: WINDOWS_TARGET,
    packageDirectory: options.packageDirectory ? path.resolve(options.packageDirectory) : null,
    packageCreatedAt: options.packageCreatedAt ?? null,
    runId: randomUUID(),
    executablePath: path.resolve(options.executablePath),
    executableSha256: options.executableSha256 ?? null,
    readiness,
    readinessElapsedMs,
    cleanup,
    startedAt,
    finishedAt: new Date(finished).toISOString(),
    durationMs: finished - started,
    result: failure ? "failed" : "passed",
    failure,
  };
  try {
    await writeEvidence(options.evidencePath, evidence);
  } catch (error) {
    const writeFailure = error instanceof Error ? error.message : String(error);
    throw new LaunchSmokeError({ ...evidence, result: "failed", failure: `Failed to write launch evidence: ${writeFailure}` });
  }
  if (failure) throw new LaunchSmokeError(evidence);
  return evidence;
}

export interface CommandResult { readonly stdout: string; readonly stderr: string; }
export type CommandRunner = (command: string, args: readonly string[], cwd: string) => Promise<CommandResult>;
export type PackageLaunchSmokeRunner = typeof runPackageLaunchSmoke;

function defaultCommandRunner(command: string, args: readonly string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${command} ${args.join(" ")} failed (${String(code)}): ${stderr.trim()}`)));
  });
}

/** Cleans, packages, verifies, and smoke-launches the sole trusted Windows package output. */
export async function verifyWindowsPackage(options: {
  readonly evidencePath?: string;
  readonly runCommand?: CommandRunner;
  readonly runLaunchSmoke?: PackageLaunchSmokeRunner;
  readonly launch?: ProcessLauncher;
  readonly queryWindow?: WindowQuery;
  readonly killProcessTree?: ProcessTreeKiller;
} = {}): Promise<LaunchEvidence> {
  const packageRoot = await realpath(DESKTOP_NATIVE_ROOT);
  const packageDirectory = path.resolve(packageRoot, "package", WINDOWS_TARGET);
  if (!isWithin(packageRoot, packageDirectory)) {
    throw new Error(`Trusted Windows package output escaped the desktop-native root: ${packageDirectory}`);
  }
  const evidencePath = path.resolve(options.evidencePath ?? path.join(packageRoot, "evidence", "windows-package-verify.json"));
  const command = options.runCommand ?? defaultCommandRunner;
  const launchSmoke = options.runLaunchSmoke ?? runPackageLaunchSmoke;
  const started = new Date().toISOString();
  let sdkOutput = "";
  let observedSdkVersion: string | null = null;
  try {
    await rm(packageDirectory, { recursive: true, force: true });
    await mkdir(packageDirectory, { recursive: true });
    const canonicalPackageDirectory = await realpath(packageDirectory);
    if (canonicalPackageDirectory !== packageDirectory || !isWithin(packageRoot, canonicalPackageDirectory)) {
      throw new Error(`Trusted Windows package output is not the expected canonical descendant: ${packageDirectory}`);
    }
    const npmCli = process.env.npm_execpath ?? path.resolve(process.execPath, "..", "node_modules", "npm", "bin", "npm-cli.js");
    const version = await command(process.execPath, [npmCli, "exec", "--no", "--", "native", "--version"], packageRoot);
    sdkOutput = `${version.stdout}${version.stderr}`.trim();
    try {
      observedSdkVersion = parseNativeSdkVersion(sdkOutput);
    } catch {
      throw new Error(`Could not determine exactly one Vercel Native SDK version from the local CLI output.`);
    }
    if (observedSdkVersion !== NATIVE_SDK_VERSION) {
      throw new Error(`Expected local Vercel Native SDK ${NATIVE_SDK_VERSION}; observed ${observedSdkVersion}.`);
    }
    await command(process.execPath, [npmCli, "exec", "--no", "--", "native", "build"], packageRoot);
    await command(process.execPath, [npmCli, "exec", "--no", "--", "native", "package", "--target", WINDOWS_TARGET, "--output", "package/windows", "--binary", "zig-out/bin/creature-os-go-agent.exe"], packageRoot);
    const executablePath = await findPackagedExecutable(packageDirectory);
    const executableStats = await stat(executablePath);
    return await launchSmoke({
      executablePath,
      evidencePath,
      expectedSdkVersion: NATIVE_SDK_VERSION,
      observedSdkVersion,
      sdkVersionOutput: sdkOutput,
      packageDirectory,
      packageCreatedAt: executableStats.birthtime.toISOString(),
      executableSha256: await sha256File(executablePath),
      launch: options.launch,
      queryWindow: options.queryWindow,
      killProcessTree: options.killProcessTree,
    });
  } catch (error) {
    if (error instanceof LaunchSmokeError) throw error;
    const finished = new Date().toISOString();
    const evidence: LaunchEvidence = {
      expectedSdkVersion: NATIVE_SDK_VERSION,
      observedSdkVersion,
      sdkVersionOutput: sdkOutput || "local Native CLI version was not observed",
      target: WINDOWS_TARGET,
      packageDirectory,
      packageCreatedAt: null,
      runId: randomUUID(),
      executablePath: null,
      executableSha256: null,
      readiness: null,
      readinessElapsedMs: null,
      cleanup: null,
      startedAt: started,
      finishedAt: finished,
      durationMs: Date.parse(finished) - Date.parse(started),
      result: "failed",
      failure: error instanceof Error ? error.message : String(error),
    };
    await writeEvidence(evidencePath, evidence);
    throw new LaunchSmokeError(evidence);
  }
}

async function main(): Promise<void> {
  const evidence = await verifyWindowsPackage();
  console.log(JSON.stringify(evidence));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
