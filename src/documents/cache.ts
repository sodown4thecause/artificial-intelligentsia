import type { DocumentActor, EditableDocument } from "./types.js";

export interface CachedDocument {
  readonly document: EditableDocument;
  readonly cachedAt: string;
  readonly lastAccessedAt: string;
  readonly accessOrder: number;
}

export interface DocumentCacheOptions {
  readonly maxEntries?: number;
  readonly now?: () => Date;
  readonly onEvent?: (event: "document.cache.write" | "document.cache.read" | "document.cache.evict" | "document.cache.sync", documentId: string) => Promise<void> | void;
}

function copy(document: EditableDocument): EditableDocument {
  return JSON.parse(JSON.stringify(document)) as EditableDocument;
}

/** Local, redacted cache with LRU eviction. Call sync when connectivity returns. */
export class DocumentCache {
  private readonly entries = new Map<string, CachedDocument>();
  private readonly maxEntries: number;
  private readonly now: () => Date;
  private accessCounter = 0;

  constructor(private readonly options: DocumentCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 50;
    this.now = options.now ?? (() => new Date());
  }

  async write(actor: DocumentActor, document: EditableDocument): Promise<void> {
    if (actor.userId !== document.createdByUserId && actor.workspaceId !== document.workspaceId) throw new Error("Cannot cache an inaccessible document.");
    const timestamp = this.now().toISOString();
    const order = ++this.accessCounter;
    this.entries.set(document.id, { document: copy(document), cachedAt: timestamp, lastAccessedAt: timestamp, accessOrder: order });
    await this.evict();
    await this.event("document.cache.write", document.id);
  }

  async read(actor: DocumentActor, documentId: string): Promise<EditableDocument | undefined> {
    const entry = this.entries.get(documentId);
    if (!entry || (actor.userId !== entry.document.createdByUserId && actor.workspaceId !== entry.document.workspaceId)) return undefined;
    const updated = { ...entry, lastAccessedAt: this.now().toISOString(), accessOrder: ++this.accessCounter };
    this.entries.set(documentId, updated);
    await this.event("document.cache.read", documentId);
    return copy(updated.document);
  }

  has(documentId: string): boolean { return this.entries.has(documentId); }

  async sync(actor: DocumentActor, documentIds: readonly string[], fetch: (documentId: string) => Promise<EditableDocument>): Promise<void> {
    for (const documentId of documentIds) await this.write(actor, await fetch(documentId));
    await this.event("document.cache.sync", documentIds.join(","));
  }

  private async evict(): Promise<void> {
    while (this.entries.size > this.maxEntries) {
      const oldest = [...this.entries.entries()].sort(([, left], [, right]) => left.accessOrder - right.accessOrder)[0];
      if (!oldest) return;
      this.entries.delete(oldest[0]);
      await this.event("document.cache.evict", oldest[0]);
    }
  }

  private async event(event: Parameters<NonNullable<DocumentCacheOptions["onEvent"]>>[0], documentId: string): Promise<void> {
    await this.options.onEvent?.(event, documentId);
  }
}
