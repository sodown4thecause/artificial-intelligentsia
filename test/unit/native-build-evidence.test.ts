import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNativeEvidenceArguments, writeNativeBuildEvidence } from "../../scripts/native-build-evidence.js";

test("native evidence records a checksum for a real library artifact", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "native-evidence-"));
  const libraryPath = path.join(directory, "libcreature_native.so");
  const outputPath = path.join(directory, "native-evidence-linux.json");
  writeFileSync(libraryPath, "native-library-bytes");

  const evidence = writeNativeBuildEvidence({ platform: "linux", libraryPath, outputPath });

  assert.equal(evidence.librarySmoke, "passed");
  assert.equal(evidence.fallbackMode, false);
  assert.equal(readFileSync(`${libraryPath}.sha256`, "utf8"), `${evidence.sha256}  libcreature_native.so\n`);
  assert.deepEqual(JSON.parse(readFileSync(outputPath, "utf8")), evidence);
});

test("native evidence rejects a smoke fallback", () => {
  assert.throws(
    () => parseNativeEvidenceArguments(["--platform", "linux", "--smoke-passed", "false", "--library", "library", "--output", "evidence"]),
    /fallback mode cannot succeed/,
  );
});
