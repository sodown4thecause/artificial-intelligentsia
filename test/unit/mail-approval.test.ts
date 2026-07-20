import assert from "node:assert/strict";
import test from "node:test";

import { ApprovalGate } from "../../src/approvals/gate.js";
import { mailSendApprovalPolicy } from "../../src/approvals/policy.js";

test("mail send approval is bound to the exact draft payload", () => {
  const gate = new ApprovalGate();
  const draft = { draftId: "draft-1", recipient: "ada@example.test", subject: "Status", body: "Ready" };
  const request = gate.create({ actionType: "mail send", target: draft.draftId, payload: draft, payloadSummary: "Send Status to Ada.", policy: mailSendApprovalPolicy, requestedBy: "author" });
  assert.throws(() => gate.assertApproved(request.id, draft), /pending/);
  gate.approve(request.id, "author");
  assert.equal(gate.assertApproved(request.id, draft).status, "approved");
  assert.throws(() => gate.assertApproved(request.id, { ...draft, body: "Changed" }), /does not match/);
});
