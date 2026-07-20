import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DurableSessionRuntime, InMemoryRunStore, type DurableRun } from "../../src/agent/runtime.js";
import { RunTimeline } from "../../src/ui/components/RunTimeline.js";
import { TaskInbox } from "../../src/ui/components/TaskInbox.js";

const timestamp = "2026-07-20T00:00:00.000Z";

function runWith(status: DurableRun["status"], id: string): DurableRun {
  return {
    id,
    task: `${status} task`,
    status,
    nextStepIndex: 0,
    checkpoints: [],
    partialOutputs: [],
    approvedStepIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

test("RunTimeline renders status, stages, sources, tools, approvals, errors, and outputs", () => {
  const runtime = new DurableSessionRuntime(new InMemoryRunStore());
  runtime.createRun("review", "Review deployment", [
    { id: "collect", execute: () => ({ output: "collected" }) },
    { id: "deploy", requiresApproval: true, execute: () => ({ output: "deployed" }) },
  ]);

  return runtime.start("review").then(() => {
    const markup = renderToStaticMarkup(
      <RunTimeline
        runtime={runtime}
        runId="review"
        plan={[{ id: "collect", label: "Collect evidence" }, { id: "deploy", label: "Deploy" }]}
        sources={["incident.md"]}
        tools={["deploy-cli"]}
      />,
    );
    for (const text of ["approval_required", "Plan stages", "Collect evidence", "Sources", "incident.md", "Tools", "deploy-cli", "Pending approval", "Approve and resume", "Outputs", "collected"]) {
      assert.match(markup, new RegExp(text));
    }
  });
});

test("approval resumes a paused approval-required run", async () => {
  const runtime = new DurableSessionRuntime(new InMemoryRunStore());
  runtime.createRun("approve", "Approve deployment", [{ id: "deploy", requiresApproval: true, execute: () => ({ output: "done" }) }]);
  await runtime.start("approve");
  assert.equal(runtime.getRun("approve")?.status, "approval_required");
  await runtime.approve("approve");
  assert.equal(runtime.getRun("approve")?.status, "completed");
});

test("TaskInbox groups input, approvals, failures, and completed work", () => {
  const markup = renderToStaticMarkup(
    <TaskInbox runs={[runWith("waiting", "input"), runWith("approval_required", "approval"), runWith("failed", "failure"), runWith("completed", "complete")]} />,
  );
  for (const text of ["Requires input (1)", "Approval requests (1)", "Failures (1)", "Completed work (1)", "waiting task", "approval_required task", "failed task", "completed task"]) {
    assert.ok(markup.includes(text));
  }
});
