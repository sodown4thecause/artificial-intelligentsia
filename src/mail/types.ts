import type {
  GmailDraft,
  GmailDraftRequest,
  GmailMessage,
  GmailSearchQuery,
  GmailThreadSummary,
} from "../connectors/gmail.js";

export type { GmailDraft, GmailDraftRequest, GmailMessage, GmailSearchQuery, GmailThreadSummary };

export interface MailThread {
  id: string;
  subject: string;
  messages: readonly GmailMessage[];
  latestMessageAt: Date;
}

export interface MailSearchResult {
  query: GmailSearchQuery;
  threads: readonly MailThread[];
}

export interface MailCitation {
  messageId: string;
  threadId: string;
  label: string;
}

export interface MailThreadSummary extends Omit<GmailThreadSummary, "citations"> {
  citations: readonly MailCitation[];
}

export interface MailDraftInput {
  threadId: string;
  to: readonly string[];
  subject: string;
  body: string;
  idempotencyKey: string;
}

export interface MailAuditEvent {
  operation: "search" | "read" | "summarize" | "create_draft";
  targetId?: string;
  occurredAt: Date;
  outcome: "success" | "error";
}
