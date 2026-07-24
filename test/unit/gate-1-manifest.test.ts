import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parseGate1EvidenceManifest, type Gate1EvidenceManifest } from "../../src/evidence/gate-1-manifest.js";

const COMMIT = "a".repeat(40);
const NATIVE_DIGEST = "b".repeat(64);
const PACKAGE_DIGEST = "c".repeat(64);

function validDevelopmentManifest(): Gate1EvidenceManifest {
  return {
    schemaVersion: 1,
    gate: "gate-1",
    generatedAt: "2026-07-24T00:00:00.000Z",
    subject: { kind: "development", commit: COMMIT, signedArtifacts: [] },
    evidence: [
      {
        id: "native-library-ci",
        type: "native-library",
        provenance: "ci",
        result: "passed",
        recordedAt: "2026-07-24T00:00:00.000Z",
        environment: { operatingSystem: "windows", architecture: "x86_64", runner: "circleci" },
        subjectCommit: COMMIT,
        sources: [".circleci/config.yml", "scripts/native-build-evidence.ts"],
        artifacts: [{ reference: "artifacts/windows/native/evidence.json", sha256: NATIVE_DIGEST, mediaType: "application/json", purpose: "native library evidence" }],
        limitations: ["No installer coverage."],
        privacy: { classification: "internal", syntheticData: true, redactionStatus: "not-required", accessScope: "maintainers" },
      },
      {
        id: "windows-directory-package",
        type: "desktop-directory-package",
        provenance: "deterministic-local",
        result: "passed",
        recordedAt: "2026-07-24T00:00:00.000Z",
        environment: { operatingSystem: "windows", architecture: "x86_64", runner: "local" },
        subjectCommit: COMMIT,
        sources: ["scripts/desktop-package-smoke.ts"],
        artifacts: [{ reference: "artifacts/windows/desktop/package.json", sha256: PACKAGE_DIGEST, packageSha256: PACKAGE_DIGEST, mediaType: "application/json", purpose: "directory package evidence" }],
        limitations: ["Directory package is not an installer."],
        privacy: { classification: "internal", syntheticData: true, redactionStatus: "not-required", accessScope: "maintainers" },
      },
    ],
  };
}

function expectRejected(value: unknown): void {
  assert.throws(() => parseGate1EvidenceManifest(value), /Invalid Gate 1 evidence manifest/);
}

test("accepts development evidence for native-library and Windows directory-package artifacts", () => {
  const manifest = validDevelopmentManifest();
  const parsed = parseGate1EvidenceManifest(manifest);
  assert.equal(parsed.subject.kind, "development");
  assert.equal(parsed.evidence.length, 2);
});

test("accepts a frozen candidate only when every artifact has a signed digest", () => {
  const manifest = validDevelopmentManifest();
  manifest.subject.kind = "frozen-release-candidate";
  manifest.subject.signedArtifacts = [
    { sha256: NATIVE_DIGEST, signatureReference: "https://example.test/signatures/native.sig" },
    { sha256: PACKAGE_DIGEST, signatureReference: "https://example.test/signatures/package.sig" },
  ];
  assert.equal(parseGate1EvidenceManifest(manifest).subject.kind, "frozen-release-candidate");
});

test("rejects unknown versions and keys", () => {
  const wrongVersion = { ...validDevelopmentManifest(), schemaVersion: 2 };
  expectRejected(wrongVersion);

  const unknownKey = Object.assign(validDevelopmentManifest(), { unsupported: true });
  expectRejected(unknownKey);
});

test("rejects malformed and mixed commits plus malformed and unbound digests", () => {
  const malformedCommit = validDevelopmentManifest();
  malformedCommit.subject.commit = "ABC";
  expectRejected(malformedCommit);

  const mixedCommit = validDevelopmentManifest();
  mixedCommit.evidence[1].subjectCommit = "d".repeat(40);
  expectRejected(mixedCommit);

  const malformedDigest = validDevelopmentManifest();
  malformedDigest.evidence[0].artifacts[0].sha256 = "not-a-digest";
  expectRejected(malformedDigest);

  const unboundFrozenDigest = validDevelopmentManifest();
  unboundFrozenDigest.subject.kind = "frozen-release-candidate";
  unboundFrozenDigest.subject.signedArtifacts = [{ sha256: NATIVE_DIGEST, signatureReference: "https://example.test/signatures/native.sig" }];
  expectRejected(unboundFrozenDigest);
});

test("rejects duplicate evidence IDs and ambiguous artifact references or digests", () => {
  const duplicateId = validDevelopmentManifest();
  duplicateId.evidence[1].id = duplicateId.evidence[0].id;
  expectRejected(duplicateId);

  const duplicateReference = validDevelopmentManifest();
  duplicateReference.evidence[1].artifacts[0].reference = duplicateReference.evidence[0].artifacts[0].reference;
  expectRejected(duplicateReference);

  const duplicateDigest = validDevelopmentManifest();
  duplicateDigest.evidence[1].artifacts[0].sha256 = duplicateDigest.evidence[0].artifacts[0].sha256;
  duplicateDigest.evidence[1].artifacts[0].packageSha256 = duplicateDigest.evidence[0].artifacts[0].sha256;
  expectRejected(duplicateDigest);
});

test("enforces passed, failed, and blocked result invariants", () => {
  const passedWithFailure = validDevelopmentManifest();
  passedWithFailure.evidence[0].failure = "unsafe-secret-value";
  expectRejected(passedWithFailure);

  const failedWithoutFailure = validDevelopmentManifest();
  failedWithoutFailure.evidence[0].result = "failed";
  expectRejected(failedWithoutFailure);

  const blockedWithoutLimitation = validDevelopmentManifest();
  blockedWithoutLimitation.evidence[0].result = "blocked";
  blockedWithoutLimitation.evidence[0].limitations = [];
  expectRejected(blockedWithoutLimitation);
});

test("rejects provenance escalation and unsafe provider or human privacy metadata", () => {
  const localProvider = validDevelopmentManifest();
  localProvider.evidence[0].type = "eve";
  expectRejected(localProvider);

  const providerNotRedacted = validDevelopmentManifest();
  providerNotRedacted.evidence[0].type = "gmail";
  providerNotRedacted.evidence[0].provenance = "live-provider";
  providerNotRedacted.evidence[0].privacy.redactionStatus = "not-required";
  expectRejected(providerNotRedacted);

  const providerWithoutConsent = validDevelopmentManifest();
  providerWithoutConsent.evidence[0].type = "calendar";
  providerWithoutConsent.evidence[0].provenance = "live-provider";
  providerWithoutConsent.evidence[0].privacy.redactionStatus = "redacted";
  providerWithoutConsent.evidence[0].privacy.syntheticData = false;
  expectRejected(providerWithoutConsent);

  const humanWithoutConsent = validDevelopmentManifest();
  humanWithoutConsent.evidence[0].type = "human-observation";
  humanWithoutConsent.evidence[0].provenance = "human";
  humanWithoutConsent.evidence[0].privacy.redactionStatus = "redacted";
  humanWithoutConsent.evidence[0].privacy.syntheticData = false;
  expectRejected(humanWithoutConsent);
});

test("rejects absolute, traversing, malformed, and secret-bearing source references", () => {
  for (const source of ["C:/secrets/evidence.json", "/tmp/evidence.json", "../evidence.json", "file:///tmp/evidence.json", "https://token@example.test/evidence", "https://example.test/evidence?token=unsafe-secret-value", "https://example.test/evidence#unsafe-secret-value", "not a path"]) {
    const manifest = validDevelopmentManifest();
    manifest.evidence[0].sources = [source];
    expectRejected(manifest);
  }
});

test("CLI accepts a valid fixture and rejects an invalid fixture without leaking it", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "gate-1-manifest-"));
  const validPath = path.join(directory, "valid.json");
  const invalidPath = path.join(directory, "invalid.json");
  writeFileSync(validPath, JSON.stringify(validDevelopmentManifest()));
  writeFileSync(invalidPath, JSON.stringify({ secret: "unsafe-secret-value" }));

  const cli = path.join("node_modules", "tsx", "dist", "cli.mjs");
  const script = path.join("scripts", "validate-gate-1-manifest.ts");
  const valid = spawnSync(process.execPath, [cli, script, validPath], { encoding: "utf8" });
  assert.equal(valid.status, 0, valid.stderr);

  const invalid = spawnSync(process.execPath, [cli, script, invalidPath], { encoding: "utf8" });
  assert.notEqual(invalid.status, 0);
  assert.doesNotMatch(`${invalid.stdout}${invalid.stderr}`, /unsafe-secret-value/);
});
