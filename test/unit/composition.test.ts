import assert from "node:assert/strict";
import test from "node:test";
import { CompositionEngine } from "../../src/composition/engine.js";
import { CompositionDraftRepository } from "../../src/composition/repository.js";
import { DocumentRepository } from "../../src/documents/repository.js";
import type { CompositionDraft } from "../../src/composition/types.js";
import type { EditableDocument } from "../../src/documents/types.js";

const actor = { userId: "user-1", workspaceId: "workspace-1" };
const source: EditableDocument = { id: "doc-1", workspaceId: "workspace-1", createdByUserId: "user-1", title: "Source", content: { blocks: [{ type: "paragraph", text: "Original" }, { type: "attachment", attachmentId: "attachment-1" }] }, visibility: "workspace", currentVersion: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };

function documentRepository() {
  return new DocumentRepository({ authorizer: { canAccess: async () => true }, searchIndex: { index: () => {}, remove: () => true, search: () => [] }, audit: { write: async () => {} } });
}

test("composition validates generated content and preserves source attachments", async () => {
  const engine = new CompositionEngine(async () => ({ content: { blocks: [{ type: "paragraph", text: "Generated" }, { type: "attachment", attachmentId: "attachment-1" }] }, title: "Draft" }));
  const draft = await engine.generate({ workspaceId: "workspace-1", prompt: "Draft an update", sourceDocument: source });
  assert.equal(draft.status, "generated");
  assert.equal(draft.content.blocks[1]?.type, "attachment");
});

test("composition rejects secret-like output and structural changes", async () => {
  const secretEngine = new CompositionEngine(async () => ({ content: { blocks: [{ type: "paragraph", text: "token=very-secret-value" }] } }));
  await assert.rejects(() => secretEngine.generate({ workspaceId: "workspace-1", prompt: "Draft" }), /secret-like/);
  const changedEngine = new CompositionEngine(async () => ({ content: { blocks: [{ type: "heading", level: 1, text: "Changed" }, { type: "attachment", attachmentId: "attachment-1" }] } }));
  await assert.rejects(() => changedEngine.generate({ workspaceId: "workspace-1", prompt: "Draft", sourceDocument: source }), /structure/);
});

test("saved composition drafts can be applied and discarded", async () => {
  const documents = documentRepository();
  const drafts = new CompositionDraftRepository(documents);
  const draft: CompositionDraft = { id: "draft-1", workspaceId: "workspace-1", prompt: "Draft", title: "New document", content: { blocks: [{ type: "paragraph", text: "Draft content" }] }, status: "generated", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
  const saved = await drafts.save(actor, draft);
  assert.equal((await drafts.list(actor, actor.workspaceId)).length, 1);
  const document = await drafts.apply(actor, saved.id);
  assert.equal(document.currentVersion, 1);
  const discarded = await drafts.discard(actor, saved.id);
  assert.equal(discarded.status, "discarded");
  assert.equal((await drafts.list(actor, actor.workspaceId)).length, 0);
});
