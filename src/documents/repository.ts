import type { SearchIndex } from "../search/types.js";
import {
  assertDocumentAccess,
  canAccessDocument,
  type WorkspaceDocumentAuthorizer,
} from "./permissions.js";
import {
  type CreateDocumentShareInput,
  type DocumentShare,
  type DocumentSharePermission,
  type DocumentShareRepository,
  InMemoryDocumentShareRepository,
} from "./share.js";
import {
  type CreateDocumentInput,
  type DocumentActor,
  type DocumentAttachment,
  type DocumentAuditSink,
  DocumentAccessError,
  type DocumentContent,
  type EditableDocument,
  type EditableDocumentVersion,
  SecretContentError,
  type SaveDocumentInput,
  StaleDocumentVersionError,
} from "./types.js";

const SECRET_PATTERN = /(?:api[_-]?key|password|secret|token)\s*[:=]\s*[^\s]+|(?:sk|ghp)_[A-Za-z0-9_-]{16,}/i;

function cloneContent(content: DocumentContent): DocumentContent {
  return JSON.parse(JSON.stringify(content)) as DocumentContent;
}

function textForSearch(content: DocumentContent): string {
  return content.blocks.map((block) => {
    if (block.type === "list") return block.items.join(" ");
    if (block.type === "table") return block.rows.flat().join(" ");
    if (block.type === "attachment") return block.caption ?? "";
    return block.text;
  }).join(" ");
}

function containsSecret(content: DocumentContent, title: string): boolean {
  return SECRET_PATTERN.test(`${title}\n${textForSearch(content)}`);
}

function now(): string {
  return new Date().toISOString();
}

export interface DocumentRepositoryOptions {
  readonly authorizer: WorkspaceDocumentAuthorizer;
  readonly searchIndex: SearchIndex;
  readonly audit: DocumentAuditSink;
  readonly shares?: DocumentShareRepository;
}

/**
 * An application repository with an intentionally small persistence contract.
 * Its in-memory maps are also useful as the local desktop implementation; a
 * database adapter can hydrate the same immutable records from the SQL tables.
 */
export class DocumentRepository {
  private readonly documents = new Map<string, EditableDocument>();
  private readonly versions = new Map<string, EditableDocumentVersion[]>();
  private readonly attachments = new Map<string, DocumentAttachment[]>();
  private readonly shares: DocumentShareRepository;
  private readonly authorizer: WorkspaceDocumentAuthorizer;
  private readonly searchIndex: SearchIndex;
  private readonly audit: DocumentAuditSink;
  private nextId = 1;

  constructor(options: DocumentRepositoryOptions) {
    this.authorizer = options.authorizer;
    this.searchIndex = options.searchIndex;
    this.audit = options.audit;
    this.shares = options.shares ?? new InMemoryDocumentShareRepository();
  }

  async create(actor: DocumentActor, input: CreateDocumentInput): Promise<EditableDocument> {
    await this.assertWorkspaceAccess(actor, input.workspaceId);
    const content = cloneContent(input.content ?? { blocks: [] });
    this.assertNoSecrets(content, input.title);
    const timestamp = now();
    const document: EditableDocument = {
      id: this.id("doc"), workspaceId: input.workspaceId, createdByUserId: actor.userId,
      title: input.title, content, visibility: input.visibility ?? "workspace", currentVersion: 1,
      createdAt: timestamp, updatedAt: timestamp,
    };
    const version = this.version(document, actor.userId, "Initial version");
    this.documents.set(document.id, document);
    this.versions.set(document.id, [version]);
    this.index(document);
    await this.audit.write({ action: "document.create", actor, documentId: document.id });
    return this.copyDocument(document);
  }

  async get(actor: DocumentActor, documentId: string): Promise<EditableDocument> {
    const document = this.require(documentId);
    await this.assertDocumentAccess(actor, document, "read");
    return this.copyDocument(document);
  }

  async list(actor: DocumentActor, workspaceId: string): Promise<readonly EditableDocument[]> {
    await this.assertWorkspaceAccess(actor, workspaceId);
    const visible = [...this.documents.values()].filter((document) => {
      if (document.workspaceId !== workspaceId) return false;
      if (document.createdByUserId === actor.userId) return true;
      if (document.visibility === "workspace") return true;
      if (this.shares.find(document.id, actor.userId) !== undefined) return true;
      return false;
    });
    await this.audit.write({ action: "document.list", actor, documentId: "*", metadata: { count: visible.length, workspaceId } });
    return visible.map((document) => this.copyDocument(document));
  }

  async listVersions(actor: DocumentActor, documentId: string): Promise<readonly EditableDocumentVersion[]> {
    const document = this.require(documentId);
    await this.assertDocumentAccess(actor, document, "read");
    return (this.versions.get(documentId) ?? []).map((version) => ({ ...version, content: cloneContent(version.content) }));
  }

  async save(actor: DocumentActor, documentId: string, input: SaveDocumentInput): Promise<EditableDocument> {
    const current = this.require(documentId);
    await this.assertDocumentAccess(actor, current, "write");
    this.assertNoSecrets(input.content, input.title);
    if (current.currentVersion !== input.expectedVersion) throw new StaleDocumentVersionError();
    const document: EditableDocument = {
      ...current, title: input.title, content: cloneContent(input.content),
      currentVersion: current.currentVersion + 1, updatedAt: now(),
    };
    this.documents.set(documentId, document);
    this.versions.get(documentId)?.push(this.version(document, actor.userId, input.changeSummary ?? null));
    this.index(document);
    await this.audit.write({ action: "document.save", actor, documentId, metadata: { version: document.currentVersion } });
    return this.copyDocument(document);
  }

  /** Restoring snapshots their old content into a new immutable version. */
  async restore(actor: DocumentActor, documentId: string, versionNumber: number, expectedVersion: number): Promise<EditableDocument> {
    const document = this.require(documentId);
    await this.assertDocumentAccess(actor, document, "write");
    const version = (this.versions.get(documentId) ?? []).find((candidate) => candidate.versionNumber === versionNumber);
    if (version === undefined) throw new Error("The requested document version does not exist.");
    const restored = await this.save(actor, documentId, {
      title: version.title, content: version.content, expectedVersion,
      changeSummary: `Restored version ${versionNumber}`,
    });
    await this.audit.write({ action: "document.restore", actor, documentId, metadata: { restoredVersion: versionNumber, version: restored.currentVersion } });
    return restored;
  }

  async linkAttachment(actor: DocumentActor, attachment: DocumentAttachment): Promise<void> {
    const document = this.require(attachment.documentId);
    if (document.workspaceId !== attachment.workspaceId) throw new DocumentAccessError();
    await this.assertDocumentAccess(actor, document, "write");
    const linked = this.attachments.get(document.id) ?? [];
    if (!linked.some((item) => item.id === attachment.id)) this.attachments.set(document.id, [...linked, { ...attachment }]);
    await this.audit.write({ action: "document.attachment.link", actor, documentId: document.id, metadata: { attachmentId: attachment.id } });
  }

  async listAttachments(actor: DocumentActor, documentId: string): Promise<readonly DocumentAttachment[]> {
    const document = this.require(documentId);
    await this.assertDocumentAccess(actor, document, "read");
    return (this.attachments.get(documentId) ?? []).map((attachment) => ({ ...attachment }));
  }

  async share(actor: DocumentActor, input: CreateDocumentShareInput): Promise<DocumentShare> {
    const document = this.require(input.documentId);
    if (document.workspaceId !== input.workspaceId) throw new DocumentAccessError();
    await this.assertDocumentAccess(actor, document, "write");
    const share = this.shares.create(input);
    await this.audit.write({ action: "document.share", actor, documentId: document.id, metadata: { sharedWithUserId: share.sharedWithUserId, permission: share.permission } });
    return share;
  }

  async revokeShare(actor: DocumentActor, documentId: string, userId: string): Promise<boolean> {
    const document = this.require(documentId);
    await this.assertDocumentAccess(actor, document, "write");
    const revoked = this.shares.revoke(documentId, userId);
    if (revoked) {
      await this.audit.write({ action: "document.share.revoke", actor, documentId, metadata: { revokedUserId: userId } });
    }
    return revoked;
  }

  async getSharedUsers(actor: DocumentActor, documentId: string): Promise<readonly DocumentShare[]> {
    const document = this.require(documentId);
    await this.assertDocumentAccess(actor, document, "write");
    return this.shares.list(documentId);
  }

  private version(document: EditableDocument, actorUserId: string, changeSummary: string | null): EditableDocumentVersion {
    return { id: this.id("version"), documentId: document.id, versionNumber: document.currentVersion,
      title: document.title, content: cloneContent(document.content), changeSummary, actorUserId, createdAt: now() };
  }

  private index(document: EditableDocument): void {
    this.searchIndex.index({ id: document.id, title: document.title, content: textForSearch(document.content),
      source: { id: document.id, uri: `document://${document.id}`, title: document.title },
      access: { workspaceId: document.workspaceId, ownerId: document.createdByUserId }, updatedAt: new Date(document.updatedAt) });
  }

  private require(documentId: string): EditableDocument {
    const document = this.documents.get(documentId);
    if (document === undefined) throw new Error("The document does not exist.");
    return document;
  }

  private async assertWorkspaceAccess(actor: DocumentActor, workspaceId: string): Promise<void> {
    if (actor.workspaceId !== workspaceId || !await this.authorizer.canAccess(actor, workspaceId)) throw new DocumentAccessError();
  }

  private async assertDocumentAccess(actor: DocumentActor, document: EditableDocument, permission: DocumentSharePermission): Promise<void> {
    await assertDocumentAccess(actor, document, permission, this.authorizer, this.shares);
  }

  private assertNoSecrets(content: DocumentContent, title: string): void {
    if (containsSecret(content, title)) throw new SecretContentError();
  }

  private copyDocument(document: EditableDocument): EditableDocument {
    return { ...document, content: cloneContent(document.content) };
  }

  private id(prefix: string): string { return `${prefix}-${this.nextId++}`; }
}
