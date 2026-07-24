import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { gate1EvidenceGovernancePolicy, gate1EvidenceTypes } from "../../src/evidence/gate-1-governance.js";
import { parseGate1EvidenceManifest, type Gate1EvidenceManifestInput } from "../../src/evidence/gate-1-manifest.js";

const COMMIT = "a".repeat(40);
const DIGEST = "b".repeat(64);
const RECORDED_AT = "2099-07-24T00:00:00.000Z";
const RETAIN_UNTIL = "2100-07-24T00:00:00.000Z";

function validManifest(): Gate1EvidenceManifestInput {
  return {
    schemaVersion: 1, gate: "gate-1", generatedAt: RECORDED_AT, subject: { kind: "development", commit: COMMIT, signedArtifacts: [] },
    evidence: [{
      id: "native-library-ci", type: "native-library", provenance: "ci", result: "passed", recordedAt: RECORDED_AT,
      environment: { operatingSystem: "windows", architecture: "x86_64", runner: "circleci" }, subjectCommit: COMMIT,
      sources: [".circleci/config.yml"], artifacts: [{ reference: "artifacts/native/evidence.json", sha256: DIGEST, role: "evidence", storage: "circleci", mediaType: "application/json", purpose: "synthetic native library report" }], limitations: [],
      privacy: { classification: "internal", syntheticData: true, redactionStatus: "not-required", redactionProfile: "none", accessScope: "maintainers", retentionPolicy: "internal-90d", retentionUntil: RETAIN_UNTIL, legalHold: false, governanceOwnerRole: "maintainers" },
      lifecycle: { state: "active" },
    }],
  };
}

function reject(value: unknown): void { assert.throws(() => parseGate1EvidenceManifest(value), /Invalid Gate 1 evidence manifest/); }

function providerEvidence(type: "eve" | "credential-round-trip" | "human-observation"): Gate1EvidenceManifestInput {
  const manifest = validManifest();
  const evidence = manifest.evidence[0];
  if (type === "human-observation") {
    Object.assign(evidence, {
      type, provenance: "human", privacy: { classification: "restricted", syntheticData: false, redactionStatus: "redacted", redactionProfile: "gate1-human-v1", accessScope: "security-release", consentReference: "governance/consent/observation-1", retentionPolicy: "human-90d", retentionUntil: RETAIN_UNTIL, legalHold: false, governanceOwnerRole: "security-release" },
      humanAttestation: { actorReference: "observer-001", role: "observer", decision: "observed", timestamp: RECORDED_AT, context: { scope: "synthetic usability session", summary: "Observed expected behavior." } },
    });
  } else if (type === "credential-round-trip") {
    Object.assign(evidence, {
      type, provenance: "live-provider", privacy: { classification: "restricted", syntheticData: true, redactionStatus: "redacted", redactionProfile: "gate1-secrets-v1", accessScope: "security-release", retentionPolicy: "ci-30d", retentionUntil: RETAIN_UNTIL, legalHold: false, governanceOwnerRole: "security-release" },
      artifacts: [{ reference: "evidence/credential-metadata.json", sha256: DIGEST, role: "report", storage: "encrypted-evidence-store", mediaType: "application/json", purpose: "redacted credential metadata only" }],
    });
  } else {
    Object.assign(evidence, {
      type, provenance: "live-provider", privacy: { classification: "restricted", syntheticData: true, redactionStatus: "redacted", redactionProfile: "gate1-provider-v1", accessScope: "security-release", retentionPolicy: "ci-30d", retentionUntil: RETAIN_UNTIL, legalHold: false, governanceOwnerRole: "security-release" },
      artifacts: [{ reference: "evidence/eve-synthetic.json", sha256: DIGEST, role: "report", storage: "encrypted-evidence-store", mediaType: "application/json", purpose: "redacted synthetic provider report" }],
    });
  }
  return manifest;
}

test("policy matrix is exhaustive and trusted output is deeply frozen", () => {
  assert.deepEqual(Object.keys(gate1EvidenceGovernancePolicy).sort(), [...gate1EvidenceTypes].sort());
  assert.equal(Object.isFrozen(gate1EvidenceTypes), true);
  assert.equal(Object.isFrozen(gate1EvidenceGovernancePolicy), true);
  assert.equal(Object.isFrozen(gate1EvidenceGovernancePolicy.eve.storageLocations), true);
  const parsed = parseGate1EvidenceManifest(validManifest());
  assert.throws(() => { (parsed.evidence[0].privacy as { accessScope: string }).accessScope = "public"; }, TypeError);
  assert.throws(() => { (parsed.evidence[0].artifacts[0] as { storage: string }).storage = "repository"; }, TypeError);
});

test("fails closed on classification, access, storage, redaction, and owner violations", () => {
  const classification = validManifest(); classification.evidence[0].privacy.classification = "public"; reject(classification);
  const access = validManifest(); access.evidence[0].privacy.accessScope = "public"; reject(access);
  const storage = validManifest(); storage.evidence[0].artifacts[0].storage = "github-release"; reject(storage);
  const redaction = validManifest(); redaction.evidence[0].privacy.redactionProfile = "gate1-provider-v1"; reject(redaction);
  const owner = validManifest(); owner.evidence[0].privacy.governanceOwnerRole = "security-release"; reject(owner);
});

test("enforces expiry, legal hold, release-lifetime, and incident retention rules", () => {
  const pastExpiry = validManifest(); pastExpiry.evidence[0].privacy.retentionUntil = "2099-07-23T00:00:00.000Z"; reject(pastExpiry);
  const expiredActive = validManifest(); expiredActive.evidence[0].recordedAt = "2020-01-01T00:00:00.000Z"; expiredActive.evidence[0].privacy.retentionUntil = "2020-02-01T00:00:00.000Z"; reject(expiredActive);
  const held = validManifest(); held.evidence[0].privacy.legalHold = true; reject(held);
  const humanLifetime = providerEvidence("human-observation"); humanLifetime.evidence[0].privacy.retentionPolicy = "release-lifetime"; delete humanLifetime.evidence[0].privacy.retentionUntil; reject(humanLifetime);
  const incident = validManifest(); Object.assign(incident.evidence[0], { result: "blocked", limitations: ["incident quarantine"], lifecycle: { state: "quarantined", incidentReference: "incidents/gate-1-001", quarantinedAt: RECORDED_AT }, privacy: { classification: "restricted", syntheticData: true, redactionStatus: "not-required", redactionProfile: "none", accessScope: "incident-response", retentionPolicy: "incident-7y-or-legal-hold", legalHold: true, governanceOwnerRole: "incident-response" }, artifacts: [{ reference: "incidents/gate-1-001/digest.json", sha256: DIGEST, role: "report", storage: "encrypted-evidence-store", mediaType: "application/json", purpose: "quarantined synthetic report" }] });
  assert.equal(parseGate1EvidenceManifest(incident).evidence[0].lifecycle.state, "quarantined");
  incident.evidence[0].privacy.legalHold = false; reject(incident);
});

test("enforces active, quarantined, and deleted lifecycle invariants", () => {
  const active = validManifest(); Object.assign(active.evidence[0].lifecycle, { deletedAt: RECORDED_AT, deletionReceiptReference: "receipts/delete-1" }); reject(active);
  const quarantined = validManifest(); Object.assign(quarantined.evidence[0], { lifecycle: { state: "quarantined", incidentReference: "incidents/gate-1-001", quarantinedAt: RECORDED_AT }, privacy: { classification: "restricted", syntheticData: true, redactionStatus: "not-required", redactionProfile: "none", accessScope: "incident-response", retentionPolicy: "incident-7y-or-legal-hold", legalHold: true, governanceOwnerRole: "incident-response" }, artifacts: [{ reference: "incidents/gate-1-001/digest.json", sha256: DIGEST, role: "report", storage: "encrypted-evidence-store", mediaType: "application/json", purpose: "quarantined report" }] }); reject(quarantined);
  const deleted = validManifest(); Object.assign(deleted.evidence[0], { result: "blocked", limitations: ["deleted tombstone"], lifecycle: { state: "deleted", deletedAt: RECORDED_AT, deletionReceiptReference: "receipts/delete-1" } }); assert.equal(parseGate1EvidenceManifest(deleted).evidence[0].lifecycle.state, "deleted");
  const noReceipt = structuredClone(deleted); delete noReceipt.evidence[0].lifecycle.deletionReceiptReference; reject(noReceipt);
});

test("provider, credential, and human evidence cannot escape restricted storage or redaction", () => {
  const provider = providerEvidence("eve"); assert.equal(parseGate1EvidenceManifest(provider).evidence[0].type, "eve");
  provider.evidence[0].artifacts[0].storage = "circleci"; reject(provider);
  const credential = providerEvidence("credential-round-trip"); credential.evidence[0].privacy.redactionProfile = "gate1-provider-v1"; reject(credential);
  const human = providerEvidence("human-observation"); human.evidence[0].artifacts[0].storage = "repository"; reject(human);
  const noConsent = providerEvidence("human-observation"); delete noConsent.evidence[0].privacy.consentReference; reject(noConsent);
});

test("blocked, quarantined, and deleted evidence cannot close Gate 1 as passed evidence", () => {
  for (const lifecycle of ["quarantined", "deleted"] as const) {
    const manifest = validManifest();
    Object.assign(manifest.evidence[0], lifecycle === "quarantined"
      ? { lifecycle: { state: lifecycle, incidentReference: "incidents/gate-1-001", quarantinedAt: RECORDED_AT }, privacy: { classification: "restricted", syntheticData: true, redactionStatus: "not-required", redactionProfile: "none", accessScope: "incident-response", retentionPolicy: "incident-7y-or-legal-hold", legalHold: true, governanceOwnerRole: "incident-response" }, artifacts: [{ reference: "incidents/gate-1-001/digest.json", sha256: DIGEST, role: "report", storage: "encrypted-evidence-store", mediaType: "application/json", purpose: "incident record" }] }
      : { lifecycle: { state: lifecycle, deletedAt: RECORDED_AT, deletionReceiptReference: "receipts/delete-1" } });
    reject(manifest);
  }
  const blocked = validManifest(); Object.assign(blocked.evidence[0], { result: "blocked", limitations: ["awaiting evidence"] }); assert.equal(parseGate1EvidenceManifest(blocked).evidence[0].result, "blocked");
});

test("CLI stays generic and never leaks manifest content", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "gate-1-manifest-"));
  const validPath = path.join(directory, "valid.json"); const sensitivePath = path.join(directory, "token-unsafe-secret-value.json");
  writeFileSync(validPath, JSON.stringify(validManifest())); writeFileSync(sensitivePath, JSON.stringify({ secret: "unsafe-secret-value" }));
  const command = [path.join("node_modules", "tsx", "dist", "cli.mjs"), path.join("scripts", "validate-gate-1-manifest.ts")];
  assert.equal(spawnSync(process.execPath, [...command, validPath], { encoding: "utf8" }).status, 0);
  const result = spawnSync(process.execPath, [...command, sensitivePath], { encoding: "utf8" }); assert.notEqual(result.status, 0); assert.doesNotMatch(`${result.stdout}${result.stderr}`, /unsafe-secret-value/);
});
