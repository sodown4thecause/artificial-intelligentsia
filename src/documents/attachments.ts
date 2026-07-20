import { createHash } from "node:crypto";
import type { ObjectStorage, SecureDownloadLink } from "../storage/types.js";
import type { DocumentActor, DocumentAttachment, DocumentAuditSink, DocumentAuthorizer } from "./types.js";
import { DocumentAccessError } from "./types.js";

const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/gif", "text/plain", "text/markdown"]);
const SAFE_FILE_NAME = /^[^\\/:*?"<>|\x00-\x1f]{1,180}$/;

export interface AttachmentUpload {
  readonly documentId: string;
  readonly workspaceId: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly content: Uint8Array;
  readonly checksum?: string;
}

export interface SecureLinkIssuer {
  create(objectId: string, expiresInSeconds: number): SecureDownloadLink;
}

export class AttachmentValidationError extends Error {
  constructor(message: string) { super(message); this.name = "AttachmentValidationError"; }
}

export class DocumentAttachmentService {
  private nextId = 1;
  private readonly attachments = new Map<string, DocumentAttachment>();

  constructor(
    private readonly storage: ObjectStorage,
    private readonly authorizer: DocumentAuthorizer,
    private readonly audit: DocumentAuditSink,
    private readonly links: SecureLinkIssuer,
  ) {}

  async upload(actor: DocumentActor, upload: AttachmentUpload): Promise<DocumentAttachment> {
    await this.assertAccess(actor, upload.workspaceId);
    this.validate(upload);
    const checksum = createHash("sha256").update(upload.content).digest("hex");
    if (upload.checksum !== undefined && upload.checksum !== checksum) throw new AttachmentValidationError("Attachment checksum does not match its content.");
    const stored = await this.storage.upload({ content: upload.content, contentType: upload.mimeType, fileName: upload.fileName });
    const attachment: DocumentAttachment = { id: `attachment-${this.nextId++}`, documentId: upload.documentId,
      workspaceId: upload.workspaceId, objectId: stored.id, fileName: upload.fileName, mimeType: upload.mimeType,
      size: stored.size, checksum: stored.sha256, uploadedByUserId: actor.userId, createdAt: new Date().toISOString() };
    this.attachments.set(attachment.id, attachment);
    await this.audit.write({ action: "document.attachment.upload", actor, documentId: upload.documentId, metadata: { attachmentId: attachment.id } });
    return { ...attachment };
  }

  async secureDownload(actor: DocumentActor, attachmentId: string, expiresInSeconds = 300): Promise<SecureDownloadLink> {
    const attachment = this.attachments.get(attachmentId);
    if (attachment === undefined) throw new Error("The attachment does not exist.");
    await this.assertAccess(actor, attachment.workspaceId);
    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 3600) throw new AttachmentValidationError("Download link expiry must be between 1 and 3600 seconds.");
    return this.links.create(attachment.objectId, expiresInSeconds);
  }

  private validate(upload: AttachmentUpload): void {
    if (!SAFE_FILE_NAME.test(upload.fileName) || upload.fileName.includes("..")) throw new AttachmentValidationError("Attachment filename is invalid.");
    if (!ALLOWED_MIME_TYPES.has(upload.mimeType)) throw new AttachmentValidationError("Attachment MIME type is not allowed.");
    if (upload.content.byteLength === 0 || upload.content.byteLength > MAX_ATTACHMENT_SIZE) throw new AttachmentValidationError("Attachment size is invalid.");
  }

  private async assertAccess(actor: DocumentActor, workspaceId: string): Promise<void> {
    if (actor.workspaceId !== workspaceId || !await this.authorizer.canAccess(actor, workspaceId)) throw new DocumentAccessError();
  }
}
