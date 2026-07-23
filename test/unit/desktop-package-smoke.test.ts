import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  findPackagedExecutable,
  LaunchSmokeError,
  runPackageLaunchSmoke,
  WINDOWS_PACKAGE_EXECUTABLE,
  type RunningProcess,
} from "../../scripts/desktop-package-smoke.js";

class EarlyExitProcess implements RunningProcess {
  readonly exitCode = 1;

  once(event: "error" | "exit", listener: (...args: readonly unknown[]) => void): unknown {
    if (event === "exit") listener(1);
    return this;
  }

  kill(): boolean {
    return true;
  }
}

class AliveProcess implements RunningProcess {
  exitCode: number | null = null;
  private exitListener: ((...args: readonly unknown[]) => void) | undefined;

  once(event: "error" | "exit", listener: (...args: readonly unknown[]) => void): unknown {
    if (event === "exit") this.exitListener = listener;
    return this;
  }

  kill(): boolean {
    this.exitCode = 0;
    this.exitListener?.(0);
    return true;
  }
}

test("desktop package discovery rejects a missing directory package", async () => {
  await assert.rejects(
    findPackagedExecutable(path.join(tmpdir(), "creature-os-no-package")),
    /Windows directory package is missing/,
  );
});

test("desktop launch smoke records and rejects an early executable exit", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "desktop-smoke-"));
  const evidencePath = path.join(directory, "evidence.json");
  await assert.rejects(
    runPackageLaunchSmoke({
      executablePath: path.join(directory, "creature-os.exe"),
      evidencePath,
      minimumAliveMs: 1,
      launch: () => new EarlyExitProcess(),
    }),
    (error: unknown) => error instanceof LaunchSmokeError && error.evidence.result === "failed",
  );
  const evidence = JSON.parse(readFileSync(evidencePath, "utf8")) as { result: string; failure: string };
  assert.equal(evidence.result, "failed");
  assert.match(evidence.failure, /exited before/);
});

test("desktop package discovery accepts the Creature OS executable", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "desktop-package-"));
  const executable = path.join(directory, WINDOWS_PACKAGE_EXECUTABLE);
  writeFileSync(executable, "fixture");
  assert.equal(await findPackagedExecutable(directory), executable);
});

test("desktop package discovery rejects an unexpected executable even when it is alone", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "desktop-package-"));
  writeFileSync(path.join(directory, "other.exe"), "fixture");
  await assert.rejects(findPackagedExecutable(directory), new RegExp(WINDOWS_PACKAGE_EXECUTABLE));
});

test("desktop launch smoke requires lifetime, terminates, and writes passing evidence", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "desktop-smoke-"));
  const evidencePath = path.join(directory, "evidence.json");
  const evidence = await runPackageLaunchSmoke({
    executablePath: path.join(directory, WINDOWS_PACKAGE_EXECUTABLE),
    evidencePath,
    minimumAliveMs: 1,
    launch: () => new AliveProcess(),
  });
  assert.equal(evidence.result, "passed");
  assert.equal(JSON.parse(readFileSync(evidencePath, "utf8")).result, "passed");
});
