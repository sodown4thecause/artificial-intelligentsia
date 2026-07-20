import assert from "node:assert/strict";
import test from "node:test";

import { DurableSessionRuntime, InMemoryRunStore, type AgentStep } from "../../src/agent/runtime.js";

test("resumes a durable multi-step task from its latest persisted checkpoint", async () => {
  const cache = new InMemoryRunStore();
  const steps: AgentStep[] = [
    { id: "collect", execute: ({ emitPartialOutput }) => { emitPartialOutput("source found"); return { output: "sources" }; } },
    { id: "write", execute: () => ({ output: "draft" }) },
  ];
  const firstRuntime = new DurableSessionRuntime(cache);
  firstRuntime.createRun("run-1", "Prepare a brief", steps);

  const completed = await firstRuntime.start("run-1");
  assert.equal(completed.status, "completed");
  assert.equal(completed.checkpoints.length, 2);
  assert.deepEqual(completed.partialOutputs.map((output) => output.value), ["source found"]);

  const reloadedRuntime = new DurableSessionRuntime(cache);
  reloadedRuntime.registerSteps("run-1", steps);
  assert.equal(reloadedRuntime.getRun("run-1")?.checkpoints.at(-1)?.stepId, "write");
});

test("risky steps require approval before invocation", async () => {
  const cache = new InMemoryRunStore();
  let invoked = false;
  const runtime = new DurableSessionRuntime(cache);
  runtime.createRun("run-approval", "Send a draft", [
    { id: "send", requiresApproval: true, execute: () => { invoked = true; return { output: "sent" }; } },
  ]);

  const awaitingApproval = await runtime.start("run-approval");
  assert.equal(awaitingApproval.status, "approval_required");
  assert.equal(invoked, false);

  const completed = await runtime.approve("run-approval");
  assert.equal(completed.status, "completed");
  assert.equal(invoked, true);
});
