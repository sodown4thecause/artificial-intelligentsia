import type { DocumentContent, EditableDocument } from "../documents/types.js";
import type { ActionDecision, ActionMetadata } from "../core/permissions/types.js";

export type ProtectedRangeKind = "name" | "number" | "citation" | "link" | "terminology" | "user";

/** A character range within the editable text representation of one document block. */
export interface ProtectedRange {
  readonly blockIndex: number;
  readonly start: number;
  readonly end: number;
  readonly kind: ProtectedRangeKind;
  readonly text: string;
  readonly authorized: boolean;
}

export type RewriteTone = "correctness" | "professional" | "friendly" | "concise" | "neutral";
export type RewriteSuggestionStatus = "pending" | "accepted" | "rejected";

export interface RewriteSuggestion {
  readonly id: string;
  readonly documentId: string;
  readonly baseVersion: number;
  readonly blockIndex: number;
  readonly originalText: string;
  readonly suggestedText: string;
  readonly protectedRanges: readonly ProtectedRange[];
  readonly reason: string;
  readonly tone: RewriteTone;
  readonly status: RewriteSuggestionStatus;
}

export interface RewriteRequest {
  readonly documentId: string;
  readonly baseVersion: number;
  readonly content: DocumentContent;
  readonly instructions: string;
  readonly tone: RewriteTone;
  readonly protectedRanges: readonly ProtectedRange[];
  readonly blockCount: number;
  readonly attachmentIds: readonly string[];
  /** Allows the intentionally echoing mock gateway to return deterministic test data. */
  readonly mockResponse?: RewriteResponse;
}

export interface RewriteResponse {
  readonly suggestions: readonly RewriteSuggestion[];
  readonly blockCount?: number;
  readonly attachmentIds?: readonly string[];
}

export interface RewriteGenerationInput {
  readonly document: EditableDocument;
  readonly instructions: string;
  readonly tone: RewriteTone;
  readonly protectedRanges?: readonly ProtectedRange[];
}

export type RewritePermissionCheck = (action: ActionMetadata) => Promise<ActionDecision>;

export interface RewriteAuditEvent {
  readonly action: "rewrite.generate" | "rewrite.preview" | "rewrite.accept" | "rewrite.reject" | "rewrite.apply";
  readonly documentId: string;
  readonly version: number;
  readonly contentReferenceId: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface RewriteAuditSink {
  write(event: RewriteAuditEvent): Promise<void> | void;
}
