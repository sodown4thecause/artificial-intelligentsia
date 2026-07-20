import assert from "node:assert/strict";
import test from "node:test";
import { MemoryControls } from "../../src/memory/controls.js";
import { MemoryInspector } from "../../src/memory/inspection.js";
import { InMemoryMemoryRepository, MemoryStore } from "../../src/memory/store.js";
import type { MemoryCandidate, MemoryScope } from "../../src/memory/types.js";

const clock = () => new Date("2026-07-20T12:00:00.000Z");
const scope: MemoryScope = { userId: "user-1", workspaceId: "workspace-1" };

function inspector() {
  const store = new MemoryStore(new InMemoryMemoryRepository(), clock);
  const controls = new MemoryControls(store);
  return new MemoryInspector(controls);
}

let candidateCounter = 0;
function approvedCandidate(content: string, type: MemoryCandidate["type"] = "personal-preferences"): MemoryCandidate {
  candidateCounter += 1;
  return { id: `candidate-${candidateCounter}`, type, content, scope, provenance: { kind: "user-confirmed" }, status: "approved", createdAt: clock().toISOString() };
}

test("reviews, filters, corrects, pins, scopes, and deletes memory items", () => {
  const store = new MemoryStore(new InMemoryMemoryRepository(), clock);
  const controls = new MemoryControls(store);
  const memoryInspector = new MemoryInspector(controls);
  store.writeCandidate(approvedCandidate("I prefer concise emails."));
  store.writeCandidate(approvedCandidate("Use friendly tone.", "writing-voice"));
  store.writeCandidate(approvedCandidate("Project X deadline is Friday.", "project-context"));
  assert.equal(memoryInspector.review(scope).length, 3);
  assert.equal(memoryInspector.review(scope, { type: "writing-voice" }).length, 1);
  const items = memoryInspector.review(scope);
  const item = items[0];
  assert.ok(item);
  memoryInspector.pin(item.id, true);
  assert.equal(memoryInspector.review(scope, { pinned: true }).length, 1);
  memoryInspector.correct(item.id, "Updated preference");
  assert.equal(memoryInspector.review(scope)[0]?.content, "Updated preference");
  memoryInspector.setScope(item.id, { ...scope, projectId: "project-a" });
  const scoped = memoryInspector.review({ ...scope, projectId: "project-a" }).find((candidate) => candidate.id === item.id);
  assert.equal(scoped?.scope.projectId, "project-a");
  assert.equal(memoryInspector.delete(item.id), true);
  assert.equal(memoryInspector.review(scope).length, 2);
});

test("exports all memory and disables/enables types and all memory", () => {
  const store = new MemoryStore(new InMemoryMemoryRepository(), clock);
  const controls = new MemoryControls(store);
  const memoryInspector = new MemoryInspector(controls);
  store.writeCandidate(approvedCandidate("Preference one."));
  store.writeCandidate(approvedCandidate("Preference two.", "writing-voice"));
  assert.equal(memoryInspector.export(scope).length, 2);
  memoryInspector.disableType("personal-preferences", scope);
  assert.equal(memoryInspector.review(scope).length, 1);
  assert.equal(memoryInspector.export(scope).length, 2);
  memoryInspector.enableType("personal-preferences", scope);
  assert.equal(memoryInspector.review(scope).length, 2);
  memoryInspector.disableAll(scope);
  assert.equal(memoryInspector.review(scope).length, 0);
  memoryInspector.enableAll(scope);
  assert.equal(memoryInspector.review(scope).length, 2);
});
