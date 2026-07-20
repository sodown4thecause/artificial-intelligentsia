import assert from "node:assert/strict";
import test from "node:test";

import { getInboxGroups } from "../../src/ui/hooks/useInbox.js";
import type { DurableRun } from "../../src/agent/runtime.js";

const run = (status: DurableRun["status"]): DurableRun => ({ id: status, task: "Prepare summary", status, nextStepIndex: 0, checkpoints: [], partialOutputs: [], approvedStepIds: [], createdAt: "2026-07-20T00:00:00.000Z", updatedAt: "2026-07-20T00:00:00.000Z" });

test("getInboxGroups assigns runs to their actionable inbox section", () => {
  const groups = getInboxGroups([run("waiting"), run("approval_required"), run("failed"), run("completed"), run("running")]);
  assert.deepEqual(Object.values(groups).map((items) => items.length), [1, 1, 1, 1]);
  assert.match(groups.approval[0]!.nextAction, /approve/i);
});
