import assert from "node:assert/strict";
import test from "node:test";

import { UserPolicyApprovalGate, extractMemoryCandidates } from "../../src/memory/candidate.js";
import { MemoryControls } from "../../src/memory/controls.js";
import { InMemoryMemoryRepository, MemoryStore } from "../../src/memory/store.js";
import { MEMORY_TYPES, type MemoryCandidate, type MemoryScope } from "../../src/memory/types.js";

const userScope: MemoryScope = { userId: "user-1" };
const workspaceScope: MemoryScope = { userId: "user-1", workspaceId: "workspace-1" };
const clock = () => new Date("2026-07-20T12:00:00.000Z");

function candidate(overrides: Partial<MemoryCandidate> = {}): MemoryCandidate {
  return {
    id: "memory-1",
    type: "personal-preferences",
    content: "Prefers concise updates.",
    scope: userScope,
    provenance: { kind: "agent-output" },
    status: "approved",
    createdAt: "2026-07-20T11:00:00.000Z",
    ...overrides,
  };
}

test("retrieves memory only within its declared user, workspace, project, task, and purpose scopes", () => {
  const store = new MemoryStore(new InMemoryMemoryRepository(), clock);
  const gate = new UserPolicyApprovalGate();
  const scoped = candidate({
    scope: { ...workspaceScope, projectId: "project-1", taskId: "task-1", purpose: "compose" },
  });
  assert.equal(store.writeCandidate(gate.decide(scoped, { approved: true })).status, "created");

  assert.equal(store.retrieve({ ...workspaceScope, projectId: "project-1", taskId: "task-1", purpose: "compose" }).length, 1);
  assert.equal(store.retrieve({ ...workspaceScope, projectId: "project-1", taskId: "task-1", purpose: "triage" }).length, 0);
  assert.equal(store.retrieve({ userId: "other-user", workspaceId: "workspace-1", projectId: "project-1", taskId: "task-1", purpose: "compose" }).length, 0);
});

test("writes approved candidates, detects duplicates and conflicts, and rejects unapproved candidates", () => {
  const store = new MemoryStore(new InMemoryMemoryRepository(), clock);
  assert.equal(store.writeCandidate(candidate({ status: "pending-approval" })).status, "rejected");
  assert.equal(store.writeCandidate(candidate()).status, "created");
  assert.equal(store.writeCandidate(candidate({ id: "memory-2", content: "  prefers concise updates. " })).status, "duplicate");
  assert.equal(store.writeCandidate(candidate({ id: "memory-3", content: "Prefers detailed updates." })).status, "conflict");
});

test("candidate extraction only accepts explicit proposals and never retains secrets", () => {
  const candidates = extractMemoryCandidates({
    output: "MEMORY[writing-voice]: Use an active voice.\nMEMORY[communication-preferences]: api_key=very-secret-value",
    scope: userScope,
    createdAt: "2026-07-20T11:00:00.000Z",
  });

  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].status, "pending-approval");
  assert.equal(candidates[1].status, "rejected-sensitive");
  assert.equal(candidates[1].content.includes("very-secret-value"), false);
});

test("controls apply to every memory type", () => {
  const store = new MemoryStore(new InMemoryMemoryRepository(), clock);
  const controls = new MemoryControls(store);

  for (const [index, type] of MEMORY_TYPES.entries()) {
    assert.equal(store.writeCandidate(candidate({ id: `memory-${index}`, type, content: `Value ${index}` })).status, "created");
    assert.equal(controls.pin(`memory-${index}`)?.pinned, true);
    assert.equal(controls.correct(`memory-${index}`, `Corrected ${index}`)?.content, `Corrected ${index}`);
    assert.equal(controls.scope(`memory-${index}`, workspaceScope)?.scope.workspaceId, "workspace-1");
    controls.disable(type, workspaceScope);
    assert.equal(store.retrieve(workspaceScope).some((item) => item.id === `memory-${index}`), false);
    controls.enable(type, workspaceScope);
    assert.equal(store.retrieve(workspaceScope).some((item) => item.id === `memory-${index}`), true);
  }

  assert.equal(controls.export(workspaceScope).length, MEMORY_TYPES.length);
  assert.equal(controls.delete("memory-0"), true);
  controls.disableAll(workspaceScope);
  assert.equal(store.retrieve(workspaceScope).length, 0);
});
