import assert from "node:assert/strict";
import test from "node:test";

import { ApprovalGate, fingerprintApprovalPayload } from "../../src/approvals/gate.js";
import { InMemoryApprovalStore } from "../../src/approvals/store.js";
import { externalWriteApprovalPolicy } from "../../src/approvals/policy.js";

test("approval requests are payload-bound, auditable, and can be decided", () => {
  let timestamp = new Date("2026-01-01T00:00:00.000Z");
  const gate = new ApprovalGate(new InMemoryApprovalStore(), { now: () => timestamp });
  const payload = { recordId: "contact-1", changes: { name: "Ada" } };
  const request = gate.create({ actionType: "external write", target: "contact-1", payload, payloadSummary: "Rename contact to Ada.", policy: externalWriteApprovalPolicy, requestedBy: "planner" });

  assert.equal(request.payloadFingerprint, fingerprintApprovalPayload(payload));
  assert.throws(() => gate.assertApproved(request.id, payload), /pending/);
  gate.approve(request.id, "reviewer", "Looks correct.");
  assert.equal(gate.assertApproved(request.id, payload).status, "approved");
  assert.throws(() => gate.assertApproved(request.id, { ...payload, changes: { name: "Grace" } }), /does not match/);
  gate.revoke(request.id, "reviewer", "Changed my mind.");
  assert.equal(gate.get(request.id)?.status, "revoked");
  assert.deepEqual(gate.getAuditEvents().map((event) => event.type), ["request", "approve", "execute", "revoke"]);
});

test("denied and expired approvals block execution", () => {
  let timestamp = new Date("2026-01-01T00:00:00.000Z");
  const gate = new ApprovalGate(new InMemoryApprovalStore(), { now: () => timestamp });
  const policy = { ...externalWriteApprovalPolicy, expiresInMs: 1 };
  const denied = gate.create({ actionType: "external write", target: "record", payload: { version: 1 }, payloadSummary: "Update record.", policy, requestedBy: "planner" });
  gate.deny(denied.id, "reviewer", "Unsafe.");
  assert.throws(() => gate.assertApproved(denied.id, { version: 1 }), /denied/);
  const expired = gate.create({ actionType: "external write", target: "record", payload: { version: 2 }, payloadSummary: "Update record.", policy, requestedBy: "planner" });
  timestamp = new Date("2026-01-01T00:00:01.000Z");
  assert.equal(gate.get(expired.id)?.status, "expired");
  assert.ok(gate.getAuditEvents().some((event) => event.type === "expire"));
});
