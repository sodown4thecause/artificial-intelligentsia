import type { ActionDecision, ActionMetadata } from "../core/permissions/types.js";
import type { DocumentActor, DocumentContent, EditableDocument } from "../documents/types.js";
import type { ProtectedRange } from "../rewrites/types.js";

export type CompositionDraftStatus = "generated" | "saved" | "applied" | "discarded";
export type ProofreadingCategory = "grammar" | "spelling" | "clarity" | "style" | "punctuation";
export type ProofreadingSeverity = "low" | "medium" | "high";
export type ProofreadingIssueStatus = "pending" | "accepted" | "rejected";

export interface CompositionDraft {
  readonly id: string;
  readonly workspaceId: string;
  readonly sourceDocumentId?: string;
  readonly baseVersion?: number;
  readonly prompt: string;
  readonly title?: string;
  readonly content: DocumentContent;
  readonly status: CompositionDraftStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProofreadingIssue {
  readonly id: string;
  readonly documentId: string;
  readonly baseVersion: number;
  readonly blockIndex: number;
  readonly start: number;
  readonly end: number;
  readonly originalText: string;
  readonly suggestedText: string;
  readonly category: ProofreadingCategory;
  readonly severity: ProofreadingSeverity;
  readonly explanation: string;
  readonly status: ProofreadingIssueStatus;
}

export interface CompositionRequest {
  readonly workspaceId: string;
  readonly prompt: string;
  readonly title?: string;
  readonly sourceDocumentId?: string;
  readonly baseVersion?: number;
  readonly sourceContent?: DocumentContent;
  /** Allows the intentionally echoing mock gateway to return deterministic test data. */
  readonly mockResponse?: CompositionResponse;
}

export interface CompositionResponse {
  readonly content: DocumentContent;
  readonly title?: string;
}

export interface ProofreadingRequest {
  readonly documentId: string;
  readonly baseVersion: number;
  readonly content: DocumentContent;
  readonly protectedRanges: readonly ProtectedRange[];
  /** Allows the intentionally echoing mock gateway to return deterministic test data. */
  readonly mockResponse?: ProofreadingResponse;
}

export interface ProofreadingResponse {
  readonly issues: readonly ProofreadingIssue[];
}

export interface CompositionGenerationInput {
  readonly workspaceId: string;
  readonly prompt: string;
  readonly title?: string;
  readonly sourceDocument?: EditableDocument;
  readonly mockResponse?: CompositionResponse;
}

export interface ProofreadingGenerationInput {
  readonly document: EditableDocument;
  readonly protectedRanges?: readonly ProtectedRange[];
  readonly mockResponse?: ProofreadingResponse;
}

export type CompositionPermissionCheck = (action: ActionMetadata) => Promise<ActionDecision>;

export interface CompositionAuditEvent {
  readonly action: "composition.generate" | "composition.preview" | "composition.save" | "composition.apply" | "composition.discard" | "proofreading.generate" | "proofreading.preview" | "proofreading.accept" | "proofreading.reject" | "proofreading.apply";
  readonly actor?: DocumentActor;
  readonly workspaceId?: string;
  readonly documentId?: string;
  readonly version?: number;
  readonly contentReferenceId: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface CompositionAuditSink {
  write(event: CompositionAuditEvent): Promise<void> | void;
}
