import {
  GMAIL_DRAFT_SCOPE,
  GMAIL_READ_SCOPE,
  type GmailConnector,
  type GmailDraft,
  type GmailMessage,
  type GmailSearchQuery,
} from "../connectors/gmail.js";
import { requireHealthyConnection } from "../connectors/types.js";
import { ApprovalGate } from "../approvals/gate.js";
import { mailSendApprovalPolicy } from "../approvals/policy.js";
import type { ApprovalRequest } from "../approvals/types.js";
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
  approvalGate?: ApprovalGate;
  auditLogger?: MailAuditLogger;
  now?: () => Date;
}

const secretPattern = /((?:api[_-]?key|token|password|secret)\s*[:=]\s*)([^\s,;]+)/gi;

export function redactMailSecrets(value: string): string {
  return value.replace(secretPattern, "$1[REDACTED]");
}

interface SendCapableGmailConnector extends GmailConnector {
  sendDraft(draftId: string): GmailDraft;
}

/** Permission-checked Gmail facade. Sending is supported only by mock connectors and always requires an approval. */
export class MailService {
  private readonly auditEvents: MailAuditEvent[] = [];
  private readonly approvalGate: ApprovalGate;
  private readonly legacyRequests = new Map<string, string>();
  private readonly now: () => Date;

  public constructor(
    private readonly connector: GmailConnector,
    options: MailServiceOptions = {},
  ) {
    this.approvalGate = options.approvalGate ?? new ApprovalGate();
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

  public requestSendApproval(draft: GmailDraft, requestedBy = "user"): ApprovalRequest {
    return this.approvalGate.create({
      actionType: "mail send",
      target: draft.id,
      payload: { draftId: draft.id, draft },
      payloadSummary: `Send draft ${draft.id}.`,
      policy: mailSendApprovalPolicy,
      requestedBy,
    });
  }

  /** @deprecated Use requestSendApproval followed by ApprovalGate.approve. */
  public approveDraft(draftId: string): void {
    const requestId = this.legacyRequests.get(draftId);
    if (requestId === undefined) throw new Error(`No approval request exists for draft ${draftId}.`);
    this.approvalGate.approve(requestId, "user");
  }

  /** @deprecated Use requestSendApproval with the complete draft payload. */
  public requireApprovalForExternalSend(draftId: string): void {
    let requestId = this.legacyRequests.get(draftId);
    if (requestId === undefined) {
      requestId = this.approvalGate.create({
        actionType: "mail send",
        target: draftId,
        payload: { draftId },
        payloadSummary: `Send draft ${draftId}.`,
        policy: mailSendApprovalPolicy,
        requestedBy: "system",
      }).id;
      this.legacyRequests.set(draftId, requestId);
    }
    const request = this.approvalGate.get(requestId);
    if (request?.status !== "approved") throw new Error(`Explicit user approval is required before sending draft ${draftId}.`);
    this.approvalGate.assertApproved(requestId, { draftId });
  }

  public sendDraft(draft: GmailDraft, approvalRequestId: string): GmailDraft {
    return this.execute("create_draft", draft.id, [GMAIL_DRAFT_SCOPE], () => {
      this.approvalGate.assertApproved(approvalRequestId, { draftId: draft.id, draft });
      const connector = this.connector as GmailConnector & Partial<SendCapableGmailConnector>;
      if (connector.sendDraft === undefined) throw new Error("The configured mail connector does not support sending drafts.");
      return connector.sendDraft(draft.id);
    });
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
