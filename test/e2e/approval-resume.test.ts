import assert from "node:assert/strict";
import test from "node:test";

import { DurableSessionRuntime, InMemoryRunStore, type AgentStep } from "../../src/agent/runtime.js";

test("pauses a durable run before a risky step and completes only after approval", async () => {
  const store = new InMemoryRunStore();
  const externalActions: string[] = [];
  const steps: AgentStep[] = [
    { id: "research", execute: () => ({ output: "renewal terms found" }) },
    { id: "send", requiresApproval: true, execute: () => { externalActions.push("send:renewal"); return { output: "sent" }; } },
  ];
  const runtime = new DurableSessionRuntime(store);
  runtime.createRun("approval-e2e", "Send renewal terms", steps);

  const paused = await runtime.start("approval-e2e");
  assert.equal(paused.status, "approval_required");
  assert.deepEqual(externalActions, []);
  assert.equal(paused.checkpoints.length, 1);

  const resumed = await runtime.approve("approval-e2e");
  assert.equal(resumed.status, "completed");
  assert.deepEqual(externalActions, ["send:renewal"]);
  assert.equal(resumed.checkpoints.length, 2);
});
