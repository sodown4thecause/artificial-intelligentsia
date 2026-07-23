import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  DESKTOP_NATIVE_ROOT,
  findPackagedExecutable,
  LaunchSmokeError,
  parseNativeSdkVersion,
  runPackageLaunchSmoke,
  verifyWindowsPackage,
  WINDOWS_PACKAGE_DIRECTORY,
  type RunningProcess,
  type WindowReadiness,
} from "../../scripts/desktop-package-smoke.js";

const temporaryDirectories: string[] = [];

async function temporaryPackage(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "creature-package-"));
  temporaryDirectories.push(directory);
  return directory;
}

async function createExactExecutable(directory: string, content = "binary"): Promise<string> {
  const executable = path.join(directory, "bin", "creature-os-go-agent.exe");
  await mkdir(path.dirname(executable), { recursive: true });
  await writeFile(executable, content);
  return executable;
}

class FakeProcess implements RunningProcess {
  readonly pid = 4242;
  exitCode: number | null = null;
  private readonly exitListeners: Array<(...args: readonly unknown[]) => void> = [];
  private readonly errorListeners: Array<(...args: readonly unknown[]) => void> = [];

  once(event: "error" | "exit", listener: (...args: readonly unknown[]) => void): this {
    (event === "exit" ? this.exitListeners : this.errorListeners).push(listener);
    return this;
  }

  kill(): boolean {
    this.exit(0);
    return true;
  }

  exit(code: number): void {
    if (this.exitCode !== null) return;
    this.exitCode = code;
    for (const listener of this.exitListeners) listener(code);
  }
}

const readyWindow: WindowReadiness = {
  ready: true,
  responsive: true,
  handle: "1234",
  title: "Creature OS - Go Agent",
  method: "test",
};

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("findPackagedExecutable", () => {
  it("requires the exact nonempty bin executable", async () => {
    const directory = await temporaryPackage();
    const expected = await createExactExecutable(directory);
    assert.equal(await findPackagedExecutable(directory), await realpath(expected));
  });

  it("rejects a missing exact package even when a stale nested basename exists", async () => {
    const directory = await temporaryPackage();
    await mkdir(path.join(directory, "stale", "bin"), { recursive: true });
    await writeFile(path.join(directory, "stale", "bin", "creature-os-go-agent.exe"), "stale");
    await assert.rejects(findPackagedExecutable(directory), /Expected exact Windows package executable/);
  });

  it("rejects an empty file and a non-file exact path", async () => {
    const empty = await temporaryPackage();
    await createExactExecutable(empty, "");
    await assert.rejects(findPackagedExecutable(empty), /nonempty regular executable/);
    const directory = await temporaryPackage();
    await mkdir(path.join(directory, "bin", "creature-os-go-agent.exe"), { recursive: true });
    await assert.rejects(findPackagedExecutable(directory), /nonempty regular executable/);
  });

  it("rejects a symlink exact executable when symlinks are available", async () => {
    const directory = await temporaryPackage();
    const outside = await temporaryPackage();
    const target = await createExactExecutable(outside);
    await mkdir(path.join(directory, "bin"), { recursive: true });
    try {
      await symlink(target, path.join(directory, "bin", "creature-os-go-agent.exe"));
    } catch {
      return;
    }
    await assert.rejects(findPackagedExecutable(directory), /must not be a symlink/);
  });
});

describe("Native SDK provenance", () => {
  it("accepts the sole required observed version", () => {
    assert.equal(parseNativeSdkVersion("native 0.5.4\n"), "0.5.4");
  });

  it("parses an observed version but rejects ambiguous CLI output", () => {
    assert.equal(parseNativeSdkVersion("native 0.5.3"), "0.5.3");
    assert.throws(() => parseNativeSdkVersion("0.5.4 (node 22.0.0)"), /exactly one/);
  });
});

describe("runPackageLaunchSmoke", () => {
  it("records readiness only after a responsive Creature OS - Go Agent window appears", async () => {
    const directory = await temporaryPackage();
    const evidence = await runPackageLaunchSmoke({
      executablePath: await createExactExecutable(directory),
      evidencePath: path.join(directory, "evidence.json"),
      launch: () => new FakeProcess(),
      queryWindow: async () => readyWindow,
      cleanupTimeoutMs: 10,
    });
    assert.equal(evidence.result, "passed");
    assert.equal(evidence.readiness?.handle, "1234");
    assert.equal(evidence.cleanup?.completed, true);
  });

  it("fails a long-lived process that never exposes a window", async () => {
    const directory = await temporaryPackage();
    await assert.rejects(runPackageLaunchSmoke({
      executablePath: await createExactExecutable(directory),
      evidencePath: path.join(directory, "evidence.json"),
      launch: () => new FakeProcess(),
      queryWindow: async () => ({ ...readyWindow, ready: false, responsive: false, handle: null, title: null }),
      readinessTimeoutMs: 10,
      cleanupTimeoutMs: 10,
    }), /did not expose a responsive Creature OS - Go Agent/);
  });

  it("fails an early process exit", async () => {
    const directory = await temporaryPackage();
    const process = new FakeProcess();
    process.exit(1);
    await assert.rejects(runPackageLaunchSmoke({
      executablePath: await createExactExecutable(directory),
      evidencePath: path.join(directory, "evidence.json"),
      launch: () => process,
      queryWindow: async () => readyWindow,
      cleanupTimeoutMs: 10,
    }), /exited before/);
  });

  it("escalates to a bounded process-tree kill when graceful exit times out", async () => {
    const directory = await temporaryPackage();
    const process = new FakeProcess();
    process.kill = () => true;
    const evidence = await runPackageLaunchSmoke({
      executablePath: await createExactExecutable(directory),
      evidencePath: path.join(directory, "evidence.json"),
      launch: () => process,
      queryWindow: async () => readyWindow,
      killProcessTree: async () => { process.exit(0); },
      cleanupTimeoutMs: 10,
    });
    assert.equal(evidence.cleanup?.forcedTreeKillAttempted, true);
    assert.equal(evidence.cleanup?.completed, true);
  });
});

describe("verifyWindowsPackage", () => {
  afterEach(async () => {
    await rm(WINDOWS_PACKAGE_DIRECTORY, { recursive: true, force: true });
  });

  async function packageWith(commandResults: readonly { readonly stdout: string; readonly stderr: string }[]): Promise<{ commands: string[][]; evidencePath: string }> {
    const directory = await temporaryPackage();
    const evidencePath = path.join(directory, "evidence.json");
    const commands: string[][] = [];
    let index = 0;
    await verifyWindowsPackage({
      evidencePath,
      runCommand: async (_command, args) => {
        commands.push([...args]);
        const result = commandResults[index++];
        if (args.includes("package")) await createExactExecutable(WINDOWS_PACKAGE_DIRECTORY);
        return result;
      },
      launch: () => new FakeProcess(),
      queryWindow: async () => readyWindow,
      killProcessTree: async () => undefined,
    });
    return { commands, evidencePath };
  }

  it("uses the authoritative output path and command order without deleting an arbitrary sibling", async () => {
    const unrelated = await temporaryPackage();
    const sentinel = path.join(unrelated, "keep.txt");
    await writeFile(sentinel, "keep");
    const { commands } = await packageWith([{ stdout: "native 0.5.4", stderr: "" }, { stdout: "", stderr: "" }, { stdout: "", stderr: "" }]);
    assert.equal(path.dirname(path.dirname(WINDOWS_PACKAGE_DIRECTORY)), path.join(DESKTOP_NATIVE_ROOT, "package"));
    assert.equal(await readFile(sentinel, "utf8"), "keep");
    assert.deepEqual(commands.map((args) => args.slice(-3)), [
      ["--", "native", "--version"],
      ["--", "native", "build"],
      ["--binary", "zig-out/bin/creature-os-go-agent.exe"],
    ]);
    assert.match(commands[2].join(" "), /--output package\/windows/);
  });

  it("preserves detailed launch evidence instead of replacing it", async () => {
    const directory = await temporaryPackage();
    const evidencePath = path.join(directory, "evidence.json");
    const detailed = {
      expectedSdkVersion: "0.5.4",
      observedSdkVersion: "0.5.4",
      sdkVersionOutput: "native 0.5.4",
      target: "windows",
      packageDirectory: WINDOWS_PACKAGE_DIRECTORY,
      packageCreatedAt: null,
      runId: "detailed-launch-failure",
      executablePath: path.join(WINDOWS_PACKAGE_DIRECTORY, "bin", "creature-os-go-agent.exe"),
      executableSha256: "abc",
      readiness: { ...readyWindow, ready: false },
      readinessElapsedMs: 10,
      cleanup: { gracefulAttempted: true, forcedTreeKillAttempted: false, completed: true, failure: null },
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:00:00.010Z",
      durationMs: 10,
      result: "failed" as const,
      failure: "window was not ready",
    };
    await assert.rejects(verifyWindowsPackage({
      evidencePath,
      runCommand: async (_command, args) => {
        if (args.includes("package")) await createExactExecutable(WINDOWS_PACKAGE_DIRECTORY);
        return { stdout: args.includes("--version") ? "native 0.5.4" : "", stderr: "" };
      },
      runLaunchSmoke: async () => {
        await writeFile(evidencePath, JSON.stringify(detailed));
        throw new LaunchSmokeError(detailed);
      },
    }), (error: unknown) => error instanceof LaunchSmokeError && error.evidence.runId === detailed.runId);
    assert.deepEqual(JSON.parse(await readFile(evidencePath, "utf8")), detailed);
  });

  it("records a wrong observed SDK version and raw output before launching", async () => {
    const directory = await temporaryPackage();
    const evidencePath = path.join(directory, "evidence.json");
    await assert.rejects(verifyWindowsPackage({ evidencePath, runCommand: async () => ({ stdout: "native 0.5.3", stderr: "" }) }), /observed 0.5.3/);
    const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
    assert.equal(evidence.expectedSdkVersion, "0.5.4");
    assert.equal(evidence.observedSdkVersion, "0.5.3");
    assert.equal(evidence.sdkVersionOutput, "native 0.5.3");
  });

  it("writes generic pre-launch evidence when the CLI cannot be observed", async () => {
    const directory = await temporaryPackage();
    const evidencePath = path.join(directory, "evidence.json");
    await assert.rejects(verifyWindowsPackage({ evidencePath, runCommand: async () => { throw new Error("CLI unavailable"); } }), /CLI unavailable/);
    const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
    assert.equal(evidence.observedSdkVersion, null);
    assert.match(evidence.failure, /CLI unavailable/);
  });
});
