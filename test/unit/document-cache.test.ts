import assert from "node:assert/strict";
import test from "node:test";
import { DocumentCache } from "../../src/documents/cache.js";
import type { EditableDocument } from "../../src/documents/types.js";

const actor = { userId: "user-1", workspaceId: "workspace-1" };

function document(id: string): EditableDocument {
  return { id, workspaceId: actor.workspaceId, createdByUserId: actor.userId, title: `Doc ${id}`, content: { blocks: [] }, visibility: "workspace", currentVersion: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
}

test("caches and reads a document", async () => {
  const cache = new DocumentCache();
  const doc = document("doc-1");
  await cache.write(actor, doc);
  assert.ok(cache.has("doc-1"));
  const read = await cache.read(actor, "doc-1");
  assert.deepEqual(read, doc);
});

test("refuses to cache or read an inaccessible document", async () => {
  const cache = new DocumentCache();
  const doc = document("doc-1");
  await assert.rejects(cache.write({ userId: "user-2", workspaceId: "workspace-2" }, doc), /inaccessible/);
  await cache.write(actor, doc);
  const read = await cache.read({ userId: "user-2", workspaceId: "workspace-2" }, "doc-1");
  assert.equal(read, undefined);
});

test("evicts least-recently-used entries over maxEntries", async () => {
  const events: string[] = [];
  const cache = new DocumentCache({ maxEntries: 2, onEvent: (event, documentId) => { events.push(`${event}:${documentId}`); } });
  await cache.write(actor, document("doc-1"));
  await cache.write(actor, document("doc-2"));
  await cache.read(actor, "doc-1");
  await cache.write(actor, document("doc-3"));
  assert.ok(!cache.has("doc-2"));
  assert.ok(cache.has("doc-1"));
  assert.ok(cache.has("doc-3"));
  assert.ok(events.some((event) => event.startsWith("document.cache.evict")));
});

test("sync fetches and caches a list of documents", async () => {
  const cache = new DocumentCache();
  const doc = document("doc-1");
  await cache.sync(actor, ["doc-1"], async () => doc);
  const read = await cache.read(actor, "doc-1");
  assert.equal(read?.title, doc.title);
});
