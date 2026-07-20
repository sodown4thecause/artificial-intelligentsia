import assert from "node:assert/strict";
import test from "node:test";
import { DocumentAttachmentService, AttachmentValidationError } from "../../src/documents/attachments.js";
import { DocumentAccessError, type DocumentAuditEvent } from "../../src/documents/types.js";
import type { DownloadedObject, ObjectMetadata, ObjectStorage, SecureDownloadLink } from "../../src/storage/types.js";

const actor = { userId: "user-1", workspaceId: "workspace-1" };
const metadata: ObjectMetadata = { id: "stored-1", contentType: "text/plain", size: 2, sha256: "x", uploadedAt: new Date().toISOString(), fileName: "note.txt" };
const storage: ObjectStorage = {
  upload: async () => metadata,
  download: async (): Promise<DownloadedObject> => ({ content: new Uint8Array([1, 2]), metadata }),
  delete: async () => undefined,
  getMetadata: async () => metadata,
};

test("attachments validate content and authorize secure links", async () => {
  const events: DocumentAuditEvent[] = [];
  const service = new DocumentAttachmentService(storage, { canAccess: (candidate) => candidate.userId === actor.userId }, { write: (event) => { events.push(event); } }, {
    create: (objectId, seconds): SecureDownloadLink => ({ url: `https://download.test/${objectId}`, expiresAt: new Date(Date.now() + seconds * 1000).toISOString() }),
  });
  const attachment = await service.upload(actor, { documentId: "doc-1", workspaceId: actor.workspaceId, fileName: "note.txt", mimeType: "text/plain", content: new Uint8Array([1, 2]) });
  assert.match((await service.secureDownload(actor, attachment.id)).url, /stored-1/);
  assert.equal(events[0]?.action, "document.attachment.upload");
  await assert.rejects(service.secureDownload({ userId: "user-2", workspaceId: actor.workspaceId }, attachment.id), DocumentAccessError);
  await assert.rejects(service.upload(actor, { documentId: "doc-1", workspaceId: actor.workspaceId, fileName: "../bad.exe", mimeType: "application/octet-stream", content: new Uint8Array([1]) }), AttachmentValidationError);
});
