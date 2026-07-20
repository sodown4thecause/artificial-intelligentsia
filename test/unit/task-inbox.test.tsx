import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { DurableRun } from "../../src/agent/runtime.js";
import { TaskInbox } from "../../src/ui/components/TaskInbox.js";

const timestamp = "2026-07-20T00:00:00.000Z";
const run = (status: DurableRun["status"], id: string): DurableRun => ({ id, task: `${status} task`, status, nextStepIndex: 0, checkpoints: [], partialOutputs: [], approvedStepIds: [], createdAt: timestamp, updatedAt: timestamp });

test("TaskInbox renders grouped summaries, next actions, and empty states", () => {
  const markup = renderToStaticMarkup(<TaskInbox runs={[run("waiting", "input"), run("approval_required", "approval"), { ...run("failed", "failed"), error: "token=super-secret" }, run("completed", "completed")]} />);
  for (const text of ["Requires input (1)", "Approval requests (1)", "Failures (1)", "Completed work (1)", "Next action:", "Approve", "Retry"]) assert.ok(markup.includes(text));
  assert.ok(!markup.includes("super-secret"));
});

test("TaskInbox renders an Open chat action for chat-originated work", () => {
  const markup = renderToStaticMarkup(<TaskInbox runs={[{ ...run("completed", "chat-run"), threadId: "thread-1" }]} />);
  assert.ok(markup.includes("Open chat"));
});

test("TaskInbox renders empty states", () => {
  const markup = renderToStaticMarkup(<TaskInbox runs={[]} />);
  assert.ok(markup.includes("No tasks require your input."));
  assert.ok(markup.includes("No completed work yet."));
});
