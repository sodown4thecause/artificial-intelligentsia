import assert from "node:assert/strict";
import test from "node:test";

import { ApprovalGate } from "../../src/approvals/gate.js";
import { InMemoryApprovalStore } from "../../src/approvals/store.js";
import { DurableSessionRuntime, InMemoryRunStore } from "../../src/agent/runtime.js";

test("runtime persists approval request and only executes after an actor approves", async () => {
  const runs = new InMemoryRunStore();
  const gate = new ApprovalGate(new InMemoryApprovalStore());
  let executions = 0;
  const steps = [{ id: "publish", requiresApproval: true, execute: () => { executions += 1; } }];
  const firstRuntime = new DurableSessionRuntime(runs, gate);
  firstRuntime.createRun("run-approval", "Publish a report", steps);
  const pending = await firstRuntime.start("run-approval");
  assert.equal(pending.status, "approval_required");
  assert.ok(pending.pendingApprovalRequestId);

  const restartedRuntime = new DurableSessionRuntime(runs, gate);
  restartedRuntime.registerSteps("run-approval", steps);
  const completed = await restartedRuntime.approve("run-approval", "reviewer", "Approved publication.");
  assert.equal(completed.status, "completed");
  assert.equal(executions, 1);
});

test("runtime denial fails a run with its reason", async () => {
  const runtime = new DurableSessionRuntime(new InMemoryRunStore(), new ApprovalGate(new InMemoryApprovalStore()));
  runtime.createRun("denied-run", "Write data", [{ id: "write", requiresApproval: true, execute: () => undefined }]);
  await runtime.start("denied-run");
  const denied = runtime.deny("denied-run", "reviewer", "Do not write this data.");
  assert.equal(denied.status, "failed");
  assert.equal(denied.error, "Do not write this data.");
});
