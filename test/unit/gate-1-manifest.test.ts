import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parseGate1EvidenceManifest, type Gate1EvidenceManifestInput } from "../../src/evidence/gate-1-manifest.js";

const COMMIT = "a".repeat(40);
const NATIVE_DIGEST = "b".repeat(64);
const PACKAGE_DIGEST = "c".repeat(64);
const EVIDENCE_DIGEST = "d".repeat(64);
const SIGNATURE_DIGEST = "e".repeat(64);

function validDevelopmentManifest(): Gate1EvidenceManifestInput {
  return {
    schemaVersion: 1, gate: "gate-1", generatedAt: "2026-07-24T00:00:00.000Z", subject: { kind: "development", commit: COMMIT, signedArtifacts: [] },
    evidence: [
      { id: "native-library-ci", type: "native-library", provenance: "ci", result: "passed", recordedAt: "2026-07-24T00:00:00.000Z", environment: { operatingSystem: "windows", architecture: "x86_64", runner: "circleci" }, subjectCommit: COMMIT, sources: [".circleci/config.yml"], artifacts: [{ reference: "artifacts/windows/native/evidence.json", sha256: NATIVE_DIGEST, role: "evidence", mediaType: "application/json", purpose: "native library evidence" }], limitations: ["No installer coverage."], privacy: { classification: "internal", syntheticData: true, redactionStatus: "not-required", accessScope: "maintainers" } },
      { id: "windows-installer", type: "installer", provenance: "deterministic-local", result: "passed", recordedAt: "2026-07-24T00:00:00.000Z", environment: { operatingSystem: "windows", architecture: "x86_64", runner: "local" }, subjectCommit: COMMIT, sources: ["scripts/desktop-package-smoke.ts"], packageSha256: PACKAGE_DIGEST, artifacts: [{ reference: "artifacts/windows/desktop/app.zip", sha256: PACKAGE_DIGEST, role: "package", mediaType: "application/zip", purpose: "installer archive" }, { reference: "artifacts/windows/desktop/evidence.json", sha256: EVIDENCE_DIGEST, role: "evidence", mediaType: "application/json", purpose: "installer validation evidence" }], limitations: ["Installer signing is pending."], privacy: { classification: "internal", syntheticData: true, redactionStatus: "not-required", accessScope: "maintainers" } },
    ],
  };
}

function expectRejected(value: unknown): void { assert.throws(() => parseGate1EvidenceManifest(value), /Invalid Gate 1 evidence manifest/); }

test("accepts role-bound package evidence and deeply freezes its trusted result", () => {
  const parsed = parseGate1EvidenceManifest(validDevelopmentManifest());
  assert.equal(parsed.evidence[1].packageSha256, PACKAGE_DIGEST);
  assert.throws(() => { (parsed.evidence[0].environment as { runner: string }).runner = "changed"; }, TypeError);
  assert.throws(() => { (parsed.evidence[1].artifacts[0] as { sha256: string }).sha256 = "f".repeat(64); }, TypeError);
  assert.throws(() => { (parsed.evidence[0] as { result: string }).result = "failed"; }, TypeError);
  assert.throws(() => { (parsed.evidence[0].privacy as { syntheticData: boolean }).syntheticData = false; }, TypeError);
});

test("accepts a shared immutable package identity across installer and signing records", () => {
  const manifest = validDevelopmentManifest();
  manifest.evidence.push({ id: "package-signing", type: "signing-notarization", provenance: "ci", result: "passed", recordedAt: "2026-07-24T00:00:00.000Z", environment: { operatingSystem: "windows", architecture: "x86_64", runner: "circleci" }, subjectCommit: COMMIT, sources: ["reports/signing.json"], packageSha256: PACKAGE_DIGEST, artifacts: [{ reference: "reports/signature.json", sha256: SIGNATURE_DIGEST, role: "signature", mediaType: "application/json", purpose: "signing validation" }], limitations: [], privacy: { classification: "internal", syntheticData: true, redactionStatus: "not-required", accessScope: "maintainers" } });
  assert.equal(parseGate1EvidenceManifest(manifest).evidence.length, 3);
  manifest.subject.kind = "frozen-release-candidate";
  manifest.subject.signedArtifacts = [NATIVE_DIGEST, PACKAGE_DIGEST, EVIDENCE_DIGEST, SIGNATURE_DIGEST].map((sha256) => ({ sha256, signatureReference: `https://example.test/${sha256}.sig` }));
  assert.equal(parseGate1EvidenceManifest(manifest).subject.kind, "frozen-release-candidate");
});

test("requires passed and failed signing evidence to identify a declared package", () => {
  for (const result of ["passed", "failed"] as const) {
    const manifest = validDevelopmentManifest();
    const signingBase = { id: `package-signing-${result}`, type: "signing-notarization" as const, provenance: "ci" as const, recordedAt: "2026-07-24T00:00:00.000Z", environment: { operatingSystem: "windows", architecture: "x86_64", runner: "circleci" }, subjectCommit: COMMIT, sources: ["reports/signing.json"], artifacts: [{ reference: `reports/signature-${result}.json`, sha256: SIGNATURE_DIGEST, role: "signature" as const, mediaType: "application/json", purpose: "signing validation" }], limitations: [], privacy: { classification: "internal" as const, syntheticData: true, redactionStatus: "not-required" as const, accessScope: "maintainers" } };
    manifest.evidence.push(result === "failed" ? { ...signingBase, result: "failed", failure: "notarization failed" } : { ...signingBase, result: "passed" });
    expectRejected(manifest);
  }
});

test("enforces subject, package, artifact, and nested strictness invariants", () => {
  const duplicateSigned = validDevelopmentManifest(); duplicateSigned.subject.kind = "frozen-release-candidate"; duplicateSigned.subject.signedArtifacts = [{ sha256: NATIVE_DIGEST, signatureReference: "https://example.test/native.sig" }, { sha256: NATIVE_DIGEST, signatureReference: "https://example.test/native-duplicate.sig" }]; expectRejected(duplicateSigned);
  const developmentSigned = validDevelopmentManifest(); developmentSigned.subject.signedArtifacts = [{ sha256: NATIVE_DIGEST, signatureReference: "https://example.test/native.sig" }]; expectRejected(developmentSigned);
  const frozenUnsigned = validDevelopmentManifest(); frozenUnsigned.subject.kind = "frozen-release-candidate"; expectRejected(frozenUnsigned);
  const nestedUnknown = validDevelopmentManifest(); Object.assign(nestedUnknown.evidence[0].environment, { unexpected: true }); expectRejected(nestedUnknown);
  const evidenceAsPackage = validDevelopmentManifest(); evidenceAsPackage.evidence[1].artifacts[1].role = "package"; expectRejected(evidenceAsPackage);
  const unboundPackage = validDevelopmentManifest(); unboundPackage.evidence[1].packageSha256 = "f".repeat(64); expectRejected(unboundPackage);
});

test("result variants fail closed and allow pending blocked evidence", () => {
  const passedFailure = validDevelopmentManifest(); Object.assign(passedFailure.evidence[0], { failure: "unexpected" }); expectRejected(passedFailure);
  const failedMissingFailure = validDevelopmentManifest(); (failedMissingFailure.evidence[0] as { result: "passed" | "failed" }).result = "failed"; expectRejected(failedMissingFailure);
  const blockedFailure = validDevelopmentManifest(); Object.assign(blockedFailure.evidence[0], { result: "blocked", artifacts: [], limitations: ["pending"], failure: "unexpected" }); expectRejected(blockedFailure);
  const blockedPending = validDevelopmentManifest(); Object.assign(blockedPending.evidence[0], { result: "blocked", artifacts: [], limitations: ["provider evidence pending"] }); assert.equal(parseGate1EvidenceManifest(blockedPending).evidence[0].artifacts.length, 0);
});

test("accepts artifact-free blocked inventory but rejects its incomplete completion claims", () => {
  const pendingTypes = ["installer", "eve", "human-observation", "sign-off"] as const;
  for (const type of pendingTypes) {
    const blocked = validDevelopmentManifest();
    Object.assign(blocked.evidence[0], { id: `pending-${type}`, type, provenance: "deterministic-local", result: "blocked", artifacts: [], limitations: [`${type} pending`], privacy: { classification: "internal", syntheticData: true, redactionStatus: "not-required", accessScope: "maintainers" } });
    assert.equal(parseGate1EvidenceManifest(blocked).evidence[0].result, "blocked");

    const passed = structuredClone(blocked);
    Object.assign(passed.evidence[0], { result: "passed", artifacts: [{ reference: `artifacts/${type}/evidence.json`, sha256: NATIVE_DIGEST, role: "evidence", mediaType: "application/json", purpose: "incomplete completion claim" }] });
    expectRejected(passed);
  }
});

test("enforces provider and human provenance, consent, and attestation", () => {
  const reverseEscalation = validDevelopmentManifest(); reverseEscalation.evidence[0].provenance = "live-provider"; expectRejected(reverseEscalation);
  const localProvider = validDevelopmentManifest(); localProvider.evidence[0].type = "eve"; expectRejected(localProvider);
  const syntheticSignOff = validDevelopmentManifest(); Object.assign(syntheticSignOff.evidence[0], { type: "sign-off", provenance: "human", privacy: { classification: "restricted", syntheticData: true, redactionStatus: "redacted", accessScope: "maintainers" }, humanAttestation: { actorReference: "participant-001", role: "release-manager", decision: "approved", timestamp: "2026-07-24T00:00:00.000Z", context: { scope: "Gate 1", summary: "Reviewed." } } }); expectRejected(syntheticSignOff);
  const noConsent = validDevelopmentManifest(); Object.assign(noConsent.evidence[0], { type: "human-observation", provenance: "human", privacy: { classification: "restricted", syntheticData: false, redactionStatus: "redacted", accessScope: "maintainers" }, humanAttestation: { actorReference: "participant-001", role: "observer", decision: "observed", timestamp: "2026-07-24T00:00:00.000Z", context: { scope: "Gate 1", summary: "Observed." } } }); expectRejected(noConsent);
});

test("CLI handles argument, file, JSON, and sensitive-path failures without content leakage", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "gate-1-manifest-"));
  const validPath = path.join(directory, "valid.json"); const malformedPath = path.join(directory, "malformed.json"); const sensitivePath = path.join(directory, "token-unsafe-secret-value.json");
  writeFileSync(validPath, JSON.stringify(validDevelopmentManifest())); writeFileSync(malformedPath, "{"); writeFileSync(sensitivePath, JSON.stringify({ secret: "unsafe-secret-value" }));
  const command = [path.join("node_modules", "tsx", "dist", "cli.mjs"), path.join("scripts", "validate-gate-1-manifest.ts")];
  assert.equal(spawnSync(process.execPath, [...command, validPath], { encoding: "utf8" }).status, 0);
  for (const args of [command, [...command, validPath, "extra"], [...command, path.join(directory, "missing.json")], [...command, directory], [...command, malformedPath], [...command, sensitivePath]]) {
    const result = spawnSync(process.execPath, args, { encoding: "utf8" }); assert.notEqual(result.status, 0); assert.doesNotMatch(`${result.stdout}${result.stderr}`, /unsafe-secret-value/);
  }
});
