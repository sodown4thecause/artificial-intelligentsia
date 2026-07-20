import assert from "node:assert/strict";
import test from "node:test";
import { DocumentRepository } from "../../src/documents/repository.js";
import { InMemoryDocumentShareRepository } from "../../src/documents/share.js";
import { DocumentAccessError } from "../../src/documents/types.js";

const actor = { userId: "user-1", workspaceId: "workspace-1" };
const otherActor = { userId: "user-2", workspaceId: "workspace-1" };
const searchIndex = { index: () => {}, remove: () => true, search: () => [] };
const audit = { write: async () => {} };

function repository() {
  return new DocumentRepository({
    authorizer: { canAccess: async () => true },
    searchIndex,
    audit,
    shares: new InMemoryDocumentShareRepository(),
  });
}

test("creator can share a document with read or write permission", async () => {
  const repo = repository();
  const document = await repo.create(actor, { workspaceId: actor.workspaceId, title: "Shared" });
  const share = await repo.share(actor, { documentId: document.id, workspaceId: actor.workspaceId, sharedWithUserId: otherActor.userId, permission: "read", createdBy: actor.userId });
  assert.equal(share.permission, "read");
  assert.equal(share.sharedWithUserId, otherActor.userId);
});

test("shared user can read a restricted document", async () => {
  const repo = repository();
  const document = await repo.create(actor, { workspaceId: actor.workspaceId, title: "Restricted", visibility: "restricted" });
  await assert.rejects(repo.get(otherActor, document.id), DocumentAccessError);
  await repo.share(actor, { documentId: document.id, workspaceId: actor.workspaceId, sharedWithUserId: otherActor.userId, permission: "read", createdBy: actor.userId });
  const accessed = await repo.get(otherActor, document.id);
  assert.equal(accessed.title, "Restricted");
});

test("read share does not allow writes", async () => {
  const repo = repository();
  const document = await repo.create(actor, { workspaceId: actor.workspaceId, title: "Restricted", visibility: "restricted" });
  await repo.share(actor, { documentId: document.id, workspaceId: actor.workspaceId, sharedWithUserId: otherActor.userId, permission: "read", createdBy: actor.userId });
  await assert.rejects(repo.save(otherActor, document.id, { title: "Changed", content: { blocks: [] }, expectedVersion: document.currentVersion }), DocumentAccessError);
});

test("write share allows writes", async () => {
  const repo = repository();
  const document = await repo.create(actor, { workspaceId: actor.workspaceId, title: "Writable", visibility: "restricted" });
  await repo.share(actor, { documentId: document.id, workspaceId: actor.workspaceId, sharedWithUserId: otherActor.userId, permission: "write", createdBy: actor.userId });
  const saved = await repo.save(otherActor, document.id, { title: "Changed", content: { blocks: [] }, expectedVersion: document.currentVersion });
  assert.equal(saved.title, "Changed");
});

test("revoke share removes access", async () => {
  const repo = repository();
  const document = await repo.create(actor, { workspaceId: actor.workspaceId, title: "Revoked", visibility: "restricted" });
  await repo.share(actor, { documentId: document.id, workspaceId: actor.workspaceId, sharedWithUserId: otherActor.userId, permission: "read", createdBy: actor.userId });
  assert.ok(await repo.get(otherActor, document.id));
  assert.equal(await repo.revokeShare(actor, document.id, otherActor.userId), true);
  await assert.rejects(repo.get(otherActor, document.id), DocumentAccessError);
});

test("non-writer cannot share or revoke", async () => {
  const repo = repository();
  const document = await repo.create(actor, { workspaceId: actor.workspaceId, title: "Owned", visibility: "restricted" });
  await repo.share(actor, { documentId: document.id, workspaceId: actor.workspaceId, sharedWithUserId: otherActor.userId, permission: "read", createdBy: actor.userId });
  await assert.rejects(repo.share(otherActor, { documentId: document.id, workspaceId: actor.workspaceId, sharedWithUserId: "user-3", permission: "read", createdBy: otherActor.userId }), DocumentAccessError);
  await assert.rejects(repo.revokeShare(otherActor, document.id, actor.userId), DocumentAccessError);
});

test("expired shares are rejected", async () => {
  const shares = new InMemoryDocumentShareRepository();
  const repo = new DocumentRepository({ authorizer: { canAccess: async () => true }, searchIndex, audit, shares });
  const document = await repo.create(actor, { workspaceId: actor.workspaceId, title: "Expiring", visibility: "restricted" });
  const past = new Date(Date.now() - 86400000).toISOString();
  await repo.share(actor, { documentId: document.id, workspaceId: actor.workspaceId, sharedWithUserId: otherActor.userId, permission: "read", createdBy: actor.userId, expiresAt: past });
  await assert.rejects(repo.get(otherActor, document.id), DocumentAccessError);
});
