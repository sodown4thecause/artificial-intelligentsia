export type DocumentSharePermission = "read" | "write";

export interface DocumentShare {
  readonly id: string;
  readonly documentId: string;
  readonly workspaceId: string;
  readonly sharedWithUserId: string;
  readonly permission: DocumentSharePermission;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly expiresAt?: string;
}

export interface CreateDocumentShareInput {
  readonly documentId: string;
  readonly workspaceId: string;
  readonly sharedWithUserId: string;
  readonly permission: DocumentSharePermission;
  readonly createdBy: string;
  readonly expiresAt?: string;
}

export interface DocumentShareRepository {
  create(input: CreateDocumentShareInput): DocumentShare;
  list(documentId: string): readonly DocumentShare[];
  find(documentId: string, userId: string, at?: Date): DocumentShare | undefined;
  revoke(documentId: string, userId: string): boolean;
}

function copy(share: DocumentShare): DocumentShare {
  return { ...share };
}

/** In-memory persistence adapter; database-backed implementations use the same contract. */
export class InMemoryDocumentShareRepository implements DocumentShareRepository {
  private readonly shares = new Map<string, DocumentShare>();
  private nextId = 1;

  create(input: CreateDocumentShareInput): DocumentShare {
    if (!input.sharedWithUserId.trim()) throw new Error("A user is required to share a document.");
    if (input.expiresAt !== undefined && Number.isNaN(Date.parse(input.expiresAt))) throw new Error("Share expiry is invalid.");
    const existing = [...this.shares.values()].find((share) => share.documentId === input.documentId && share.sharedWithUserId === input.sharedWithUserId);
    const share: DocumentShare = {
      id: existing?.id ?? `share-${this.nextId++}`,
      ...input,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    this.shares.set(share.id, share);
    return copy(share);
  }

  list(documentId: string): readonly DocumentShare[] {
    return [...this.shares.values()].filter((share) => share.documentId === documentId).map(copy);
  }

  find(documentId: string, userId: string, at = new Date()): DocumentShare | undefined {
    const share = [...this.shares.values()].find((candidate) => candidate.documentId === documentId && candidate.sharedWithUserId === userId);
    if (!share || (share.expiresAt !== undefined && Date.parse(share.expiresAt) <= at.getTime())) return undefined;
    return copy(share);
  }

  revoke(documentId: string, userId: string): boolean {
    const share = [...this.shares.values()].find((candidate) => candidate.documentId === documentId && candidate.sharedWithUserId === userId);
    return share === undefined ? false : this.shares.delete(share.id);
  }
}
