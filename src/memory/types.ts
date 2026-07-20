/** Categories of durable, user-controlled memory. */
export const MEMORY_TYPES = [
  "personal-preferences",
  "writing-voice",
  "communication-preferences",
  "project-context",
  "workspace-terminology",
  "reusable-procedures",
  "relationship-context",
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

/**
 * A memory applies only within the identifiers it declares. `userId` is always
 * required; the remaining fields narrow its visibility.
 */
export interface MemoryScope {
  userId: string;
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  purpose?: string;
}

/**
 * Memory records observations and preferences; it never copies a canonical
 * email, document, database record, audit/approval record, git history, or a
 * credential. Source references are opaque pointers, not source content.
 */
export interface MemoryProvenance {
  kind: "agent-output" | "user-confirmed";
  reference?: string;
}

export interface MemoryItem {
  id: string;
  type: MemoryType;
  content: string;
  scope: MemoryScope;
  provenance: MemoryProvenance;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MemoryCandidateStatus =
  | "pending-approval"
  | "approved"
  | "rejected-sensitive"
  | "rejected-policy"
  | "duplicate"
  | "conflict";

export interface MemoryCandidate {
  id: string;
  type: MemoryType;
  content: string;
  scope: MemoryScope;
  provenance: MemoryProvenance;
  status: MemoryCandidateStatus;
  reason?: string;
  createdAt: string;
}

export interface MemoryRetrievalRequest extends MemoryScope {}

export interface MemoryWriteResult {
  status: "created" | "duplicate" | "conflict" | "rejected";
  item?: MemoryItem;
  conflictingItem?: MemoryItem;
  reason?: string;
}

export interface MemoryCategorySetting {
  scope: MemoryScope;
  type?: MemoryType;
  disabled: boolean;
}
