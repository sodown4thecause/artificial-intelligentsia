import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export const NATIVE_SDK_VERSION = "0.5.4";
export const WINDOWS_TARGET = "windows";
export const WINDOWS_PACKAGE_EXECUTABLE = "creature-os-go-agent.exe";

export interface LaunchEvidence {
  readonly sdkVersion: string;
  readonly target: string;
  readonly executablePath: string | null;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly result: "passed" | "failed";
  readonly failure: string | null;
}

export interface RunningProcess {
  readonly exitCode: number | null;
  once(event: "error" | "exit", listener: (...args: readonly unknown[]) => void): unknown;
  kill(): boolean;
}

export type ProcessLauncher = (executablePath: string) => RunningProcess;

export class LaunchSmokeError extends Error {
  constructor(readonly evidence: LaunchEvidence) {
    super(evidence.failure ?? "Desktop launch smoke failed");
  }
}

async function collectExecutables(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectExecutables(entryPath);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".exe") ? [entryPath] : [];
  }));
  return nested.flat();
}

export async function findPackagedExecutable(packageDirectory: string): Promise<string> {
  let executables: string[];
  try {
    executables = await collectExecutables(packageDirectory);
  } catch {
    throw new Error(`Windows directory package is missing at ${packageDirectory}. Run npm run desktop:package:windows first.`);
  }

  const creatureExecutable = executables.filter(
    (candidate) => path.basename(candidate).toLowerCase() === WINDOWS_PACKAGE_EXECUTABLE,
  );
  if (creatureExecutable.length === 1) return path.resolve(creatureExecutable[0]);
  if (creatureExecutable.length === 0) {
    throw new Error(`Expected ${WINDOWS_PACKAGE_EXECUTABLE} under ${packageDirectory}; found: ${executables.join(", ") || "none"}`);
  }
  throw new Error(`Expected exactly one ${WINDOWS_PACKAGE_EXECUTABLE} under ${packageDirectory}; found: ${creatureExecutable.join(", ")}`);
}

function defaultLauncher(executablePath: string): RunningProcess {
  return spawn(executablePath, [], { detached: false, stdio: "ignore", windowsHide: true });
}

function waitForMinimumLifetime(process: RunningProcess, minimumAliveMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    process.once("error", (error) => reject(error instanceof Error ? error : new Error("Packaged executable could not start.")));
    process.once("exit", (code) => reject(new Error(`Packaged executable exited before ${minimumAliveMs}ms (exit code ${String(code)}).`)));
    setTimeout(resolve, minimumAliveMs);
  });
}

function waitForExit(process: RunningProcess): Promise<void> {
  if (process.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => process.once("exit", () => resolve()));
}

async function writeEvidence(evidencePath: string, evidence: LaunchEvidence): Promise<void> {
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

export async function runPackageLaunchSmoke(options: {
  readonly executablePath: string;
  readonly evidencePath: string;
  readonly minimumAliveMs?: number;
  readonly launch?: ProcessLauncher;
}): Promise<LaunchEvidence> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const minimumAliveMs = options.minimumAliveMs ?? 2_000;
  try {
    const process = (options.launch ?? defaultLauncher)(options.executablePath);
    await waitForMinimumLifetime(process, minimumAliveMs);
    if (!process.kill()) throw new Error("Packaged executable could not be terminated cleanly.");
    await waitForExit(process);
    const finished = Date.now();
    const evidence: LaunchEvidence = {
      sdkVersion: NATIVE_SDK_VERSION,
      target: WINDOWS_TARGET,
      executablePath: path.resolve(options.executablePath),
      startedAt,
      finishedAt: new Date(finished).toISOString(),
      durationMs: finished - started,
      result: "passed",
      failure: null,
    };
    await writeEvidence(options.evidencePath, evidence);
    return evidence;
  } catch (error) {
    const finished = Date.now();
    const evidence: LaunchEvidence = {
      sdkVersion: NATIVE_SDK_VERSION,
      target: WINDOWS_TARGET,
      executablePath: path.resolve(options.executablePath),
      startedAt,
      finishedAt: new Date(finished).toISOString(),
      durationMs: finished - started,
      result: "failed",
      failure: error instanceof Error ? error.message : String(error),
    };
    await writeEvidence(options.evidencePath, evidence);
    throw new LaunchSmokeError(evidence);
  }
}

async function main(): Promise<void> {
  const packageDirectory = path.resolve(process.env.DESKTOP_PACKAGE_DIR ?? "apps/desktop-native/package/windows");
  const evidencePath = path.resolve(process.env.DESKTOP_SMOKE_EVIDENCE ?? "apps/desktop-native/evidence/windows-launch-smoke.json");
  const executablePath = await findPackagedExecutable(packageDirectory);
  const evidence = await runPackageLaunchSmoke({ executablePath, evidencePath });
  console.log(JSON.stringify(evidence));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
