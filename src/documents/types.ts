/**
 * Documents use a deliberately small JSON block format.  It is portable across
 * desktop and web clients and avoids storing executable rich-text markup.
 */
export type DocumentBlock =
  | { readonly type: "paragraph"; readonly text: string }
  | { readonly type: "heading"; readonly level: 1 | 2 | 3; readonly text: string }
  | { readonly type: "list"; readonly ordered: boolean; readonly items: readonly string[] }
  | { readonly type: "table"; readonly rows: readonly (readonly string[])[] }
  | { readonly type: "attachment"; readonly attachmentId: string; readonly caption?: string };

export interface DocumentContent {
  readonly blocks: readonly DocumentBlock[];
}

export type DocumentVisibility = "workspace" | "restricted" | "private";

export interface EditableDocument {
  readonly id: string;
  readonly workspaceId: string;
  readonly createdByUserId: string;
  readonly title: string;
  readonly content: DocumentContent;
  readonly visibility: DocumentVisibility;
  readonly currentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EditableDocumentVersion {
  readonly id: string;
  readonly documentId: string;
  readonly versionNumber: number;
  readonly content: DocumentContent;
  readonly title: string;
  readonly changeSummary: string | null;
  readonly actorUserId: string;
  readonly createdAt: string;
}

export interface DocumentAttachment {
  readonly id: string;
  readonly documentId: string;
  readonly workspaceId: string;
  readonly objectId: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly checksum: string;
  readonly uploadedByUserId: string;
  readonly createdAt: string;
}

export interface DocumentActor {
  readonly userId: string;
  readonly workspaceId: string;
}

export interface CreateDocumentInput {
  readonly workspaceId: string;
  readonly title: string;
  readonly content?: DocumentContent;
  readonly visibility?: DocumentVisibility;
}

export interface SaveDocumentInput {
  readonly title: string;
  readonly content: DocumentContent;
  /** Optimistic concurrency guard; saves with an old value are rejected. */
  readonly expectedVersion: number;
  readonly changeSummary?: string;
}

export interface DocumentAuditEvent {
  readonly action: "document.create" | "document.save" | "document.restore" | "document.attachment.link" | "document.attachment.upload";
  readonly actor: DocumentActor;
  readonly documentId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface DocumentAuthorizer {
  canAccess(actor: DocumentActor, workspaceId: string): boolean | Promise<boolean>;
}

export interface DocumentAuditSink {
  write(event: DocumentAuditEvent): void | Promise<void>;
}

export class DocumentAccessError extends Error {
  constructor() {
    super("The actor is not allowed to access this document.");
    this.name = "DocumentAccessError";
  }
}

export class StaleDocumentVersionError extends Error {
  constructor() {
    super("The document has changed. Reload it before saving.");
    this.name = "StaleDocumentVersionError";
  }
}

export class SecretContentError extends Error {
  constructor() {
    super("Document content appears to contain a secret and was not saved.");
    this.name = "SecretContentError";
  }
}
