import assert from "node:assert/strict";
import test from "node:test";
import { DocumentRepository } from "../../src/documents/repository.js";
import { DocumentAccessError, SecretContentError, StaleDocumentVersionError, type DocumentAuditEvent } from "../../src/documents/types.js";
import type { SearchDocument, SearchIndex, SearchPrincipal, SearchQuery, SearchResult } from "../../src/search/types.js";

const actor = { userId: "user-1", workspaceId: "workspace-1" };
const content = { blocks: [{ type: "paragraph" as const, text: "First draft" }] };

class TestIndex implements SearchIndex {
  readonly indexed: SearchDocument[] = [];
  index(document: SearchDocument): void { this.indexed.push(document); }
  remove(): boolean { return false; }
  search(_query: SearchQuery, _principal: SearchPrincipal): SearchResult[] { return []; }
}

test("documents create immutable versions, index content, and audit saves", async () => {
  const index = new TestIndex();
  const events: DocumentAuditEvent[] = [];
  const repository = new DocumentRepository({ authorizer: { canAccess: () => true }, searchIndex: index, audit: { write: (event) => { events.push(event); } } });
  const created = await repository.create(actor, { workspaceId: actor.workspaceId, title: "Plan", content });
  const saved = await repository.save(actor, created.id, { title: "Updated plan", content: { blocks: [{ type: "heading", level: 1, text: "Updated" }] }, expectedVersion: 1, changeSummary: "Renamed" });
  assert.equal(saved.currentVersion, 2);
  assert.equal((await repository.listVersions(actor, created.id)).length, 2);
  assert.equal(index.indexed.at(-1)?.content, "Updated");
  assert.deepEqual(events.map((event) => event.action), ["document.create", "document.save"]);
});

test("restore appends a version and stale saves are rejected", async () => {
  const repository = new DocumentRepository({ authorizer: { canAccess: () => true }, searchIndex: new TestIndex(), audit: { write: () => undefined } });
  const created = await repository.create(actor, { workspaceId: actor.workspaceId, title: "Plan", content });
  await repository.save(actor, created.id, { title: "Second", content: { blocks: [{ type: "paragraph", text: "Second draft" }] }, expectedVersion: 1 });
  const restored = await repository.restore(actor, created.id, 1, 2);
  assert.equal(restored.currentVersion, 3);
  assert.equal(restored.content.blocks[0]?.type, "paragraph");
  await assert.rejects(repository.save(actor, created.id, { title: "Stale", content, expectedVersion: 2 }), StaleDocumentVersionError);
});

test("documents reject secrets and unauthorized users", async () => {
  const repository = new DocumentRepository({ authorizer: { canAccess: (candidate) => candidate.userId === actor.userId }, searchIndex: new TestIndex(), audit: { write: () => undefined } });
  await assert.rejects(repository.create(actor, { workspaceId: actor.workspaceId, title: "Secret", content: { blocks: [{ type: "paragraph", text: "api_key=very-secret-value" }] } }), SecretContentError);
  const created = await repository.create(actor, { workspaceId: actor.workspaceId, title: "Safe", content });
  await assert.rejects(repository.get({ userId: "user-2", workspaceId: actor.workspaceId }, created.id), DocumentAccessError);
});
