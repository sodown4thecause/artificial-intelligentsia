import assert from "node:assert/strict";
import test from "node:test";
import { ProofreaderEngine } from "../../src/composition/proofreader.js";
import { DocumentRepository } from "../../src/documents/repository.js";
import type { EditableDocument } from "../../src/documents/types.js";

const actor = { userId: "user-1", workspaceId: "workspace-1" };
const document: EditableDocument = { id: "doc-1", workspaceId: "workspace-1", createdByUserId: "user-1", title: "Proofread", content: { blocks: [{ type: "paragraph", text: "This is teh draft." }] }, visibility: "workspace", currentVersion: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
const issue = { id: "issue-1", documentId: "doc-1", baseVersion: 1, blockIndex: 0, start: 8, end: 11, originalText: "teh", suggestedText: "the", category: "spelling" as const, severity: "low" as const, explanation: "Spelling correction", status: "pending" as const };

test("proofreader validates issues, groups them, and supports batch decisions", async () => {
  const engine = new ProofreaderEngine(async () => ({ issues: [issue] }));
  const issues = await engine.generate({ document });
  assert.equal(issues[0]?.status, "pending");
  assert.equal(engine.decideBatch(issues, "accepted") instanceof Promise, true);
  const accepted = await engine.decideBatch(issues, "accepted");
  assert.equal(accepted[0]?.status, "accepted");
  const protectedEngine = new ProofreaderEngine(async () => ({ issues: [{ ...issue, start: 0, end: 4, originalText: "This", suggestedText: "That" }] }));
  await assert.rejects(() => protectedEngine.generate({ document, protectedRanges: [{ blockIndex: 0, start: 0, end: 4, kind: "user", text: "This", authorized: false }] }), /protected/);
});

test("proofreader rejects stale applications", async () => {
  const repository = new DocumentRepository({ authorizer: { canAccess: async () => true }, searchIndex: { index: () => {}, remove: () => true, search: () => [] }, audit: { write: async () => {} } });
  const current = await repository.create(actor, { workspaceId: actor.workspaceId, title: document.title, content: document.content });
  const engine = new ProofreaderEngine();
  await repository.save(actor, current.id, { title: current.title, content: current.content, expectedVersion: current.currentVersion });
  await assert.rejects(() => engine.apply(repository, actor, current.id, 1, [{ ...issue, documentId: current.id }]), /stale/);
});
