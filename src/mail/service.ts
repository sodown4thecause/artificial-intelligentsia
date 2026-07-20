import {
  GMAIL_DRAFT_SCOPE,
  GMAIL_READ_SCOPE,
  type GmailConnector,
  type GmailDraft,
  type GmailMessage,
  type GmailSearchQuery,
} from "../connectors/gmail.js";
import { requireHealthyConnection } from "../connectors/types.js";
import { MailDraftApprovalGate } from "./approval.js";
import type {
  MailAuditEvent,
  MailCitation,
  MailDraftInput,
  MailSearchResult,
  MailThread,
  MailThreadSummary,
} from "./types.js";

export interface MailAuditLogger {
  record(event: MailAuditEvent): void;
}

export interface MailServiceOptions {
  approvalGate?: MailDraftApprovalGate;
  auditLogger?: MailAuditLogger;
  now?: () => Date;
}

const secretPattern = /((?:api[_-]?key|token|password|secret)\s*[:=]\s*)([^\s,;]+)/gi;

export function redactMailSecrets(value: string): string {
  return value.replace(secretPattern, "$1[REDACTED]");
}

/** Permission-checked Gmail read and draft facade. It intentionally exposes no send method. */
export class MailService {
  private readonly auditEvents: MailAuditEvent[] = [];
  private readonly approvalGate: MailDraftApprovalGate;
  private readonly now: () => Date;

  public constructor(
    private readonly connector: GmailConnector,
    options: MailServiceOptions = {},
  ) {
    this.approvalGate = options.approvalGate ?? new MailDraftApprovalGate();
    this.now = options.now ?? (() => new Date());
    this.auditLogger = options.auditLogger;
  }

  private readonly auditLogger: MailAuditLogger | undefined;

  public getAuditEvents(): readonly MailAuditEvent[] {
    return [...this.auditEvents];
  }

  public searchMessages(query: GmailSearchQuery): MailSearchResult {
    return this.execute("search", undefined, [GMAIL_READ_SCOPE], () => {
      const messages = this.connector.searchMessages(query).map(redactMessage);
      return { query, threads: groupMessagesByThread(messages) };
    });
  }

  public readMessage(messageId: string): GmailMessage {
    return this.execute("read", messageId, [GMAIL_READ_SCOPE], () => redactMessage(this.connector.readMessage(messageId)));
  }

  public summarizeThread(threadId: string): MailThreadSummary {
    return this.execute("summarize", threadId, [GMAIL_READ_SCOPE], () => {
      const connectorSummary = this.connector.summarizeThread(threadId);
      const messages = this.connector.searchMessages({}).filter((message) => message.threadId === threadId);
      const citations = connectorSummary.citations.map((messageId) => toCitation(messageId, threadId, messages));
      return { threadId, summary: redactMailSecrets(connectorSummary.summary), citations };
    });
  }

  public createDraft(input: MailDraftInput): GmailDraft {
    return this.execute("create_draft", input.threadId, [GMAIL_DRAFT_SCOPE], () => this.connector.createDraft({
      ...input,
      subject: redactMailSecrets(input.subject),
      body: redactMailSecrets(input.body),
    }));
  }

  public approveDraft(draftId: string): void {
    this.approvalGate.approve(draftId);
  }

  public requireApprovalForExternalSend(draftId: string): void {
    this.approvalGate.requireApprovalForExternalSend(draftId);
  }

  private execute<T>(
    operation: MailAuditEvent["operation"],
    targetId: string | undefined,
    requiredScopes: readonly string[],
    action: () => T,
  ): T {
    try {
      requireHealthyConnection(this.connector.getHealth(), requiredScopes, this.now());
      const result = action();
      this.record(operation, targetId, "success");
      return result;
    } catch (error) {
      this.record(operation, targetId, "error");
      throw error;
    }
  }

  private record(operation: MailAuditEvent["operation"], targetId: string | undefined, outcome: MailAuditEvent["outcome"]): void {
    const event = { operation, ...(targetId === undefined ? {} : { targetId }), occurredAt: this.now(), outcome };
    this.auditEvents.push(event);
    this.auditLogger?.record(event);
  }
}

function redactMessage(message: GmailMessage): GmailMessage {
  return { ...message, subject: redactMailSecrets(message.subject), body: redactMailSecrets(message.body) };
}

function groupMessagesByThread(messages: readonly GmailMessage[]): readonly MailThread[] {
  const grouped = new Map<string, GmailMessage[]>();
  for (const message of messages) grouped.set(message.threadId, [...(grouped.get(message.threadId) ?? []), message]);
  return [...grouped.entries()]
    .map(([id, threadMessages]) => ({
      id,
      subject: threadMessages[0]?.subject ?? "(No subject)",
      messages: threadMessages.sort((left, right) => left.receivedAt.getTime() - right.receivedAt.getTime()),
      latestMessageAt: new Date(Math.max(...threadMessages.map((message) => message.receivedAt.getTime()))),
    }))
    .sort((left, right) => right.latestMessageAt.getTime() - left.latestMessageAt.getTime());
}

function toCitation(messageId: string, threadId: string, messages: readonly GmailMessage[]): MailCitation {
  const message = messages.find((candidate) => candidate.id === messageId);
  return { messageId, threadId, label: message === undefined ? `Message ${messageId}` : `${message.from}: ${message.subject}` };
}
