import {
  type ConnectorHealth,
  type ConnectorScope,
  ConnectorError,
  requireHealthyConnection,
} from "./types.js";

export const GMAIL_READ_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const GMAIL_DRAFT_SCOPE = "https://www.googleapis.com/auth/gmail.compose";

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: readonly string[];
  subject: string;
  body: string;
  receivedAt: Date;
  labels: readonly string[];
}

export interface GmailSearchQuery {
  text?: string;
  from?: string;
  label?: string;
  after?: Date;
  before?: Date;
}

export interface GmailThreadSummary {
  threadId: string;
  summary: string;
  citations: readonly string[];
}

export interface GmailDraftRequest {
  threadId: string;
  to: readonly string[];
  subject: string;
  body: string;
  idempotencyKey: string;
}

export interface GmailDraft {
  id: string;
  threadId: string;
  to: readonly string[];
  subject: string;
  body: string;
  status: "draft";
}

export interface GmailConnector {
  getHealth(): ConnectorHealth;
  readMessage(messageId: string): GmailMessage;
  searchMessages(query: GmailSearchQuery): readonly GmailMessage[];
  summarizeThread(threadId: string): GmailThreadSummary;
  createDraft(request: GmailDraftRequest): GmailDraft;
}

export interface MockGmailConnectorOptions {
  health: ConnectorHealth;
  messages: readonly GmailMessage[];
  now?: () => Date;
}

/** Deterministic Gmail contract double. It stores drafts only; it can never send mail. */
export class MockGmailConnector implements GmailConnector {
  private readonly draftsByIdempotencyKey = new Map<string, GmailDraft>();
  private nextDraftNumber = 1;
  private readonly now: () => Date;

  public constructor(private health: ConnectorHealth, private readonly messages: readonly GmailMessage[], options?: Pick<MockGmailConnectorOptions, "now">) {
    this.now = options?.now ?? (() => new Date());
  }

  public getHealth(): ConnectorHealth {
    return this.health;
  }

  public readMessage(messageId: string): GmailMessage {
    this.requireScopes([GMAIL_READ_SCOPE]);
    const message = this.messages.find((candidate) => candidate.id === messageId);
    if (message === undefined) {
      throw new ConnectorError("NOT_FOUND", `Message ${messageId} was not found.`);
    }
    return message;
  }

  public searchMessages(query: GmailSearchQuery): readonly GmailMessage[] {
    this.requireScopes([GMAIL_READ_SCOPE]);
    const text = query.text?.toLocaleLowerCase();
    const from = query.from?.toLocaleLowerCase();
    const label = query.label?.toLocaleLowerCase();
    return this.messages.filter((message) => {
      const searchable = `${message.subject}\n${message.body}`.toLocaleLowerCase();
      return (text === undefined || searchable.includes(text))
        && (from === undefined || message.from.toLocaleLowerCase() === from)
        && (label === undefined || message.labels.some((candidate) => candidate.toLocaleLowerCase() === label))
        && (query.after === undefined || message.receivedAt > query.after)
        && (query.before === undefined || message.receivedAt < query.before);
    });
  }

  public summarizeThread(threadId: string): GmailThreadSummary {
    this.requireScopes([GMAIL_READ_SCOPE]);
    const messages = this.messages.filter((message) => message.threadId === threadId);
    if (messages.length === 0) {
      throw new ConnectorError("NOT_FOUND", `Thread ${threadId} was not found.`);
    }
    return {
      threadId,
      summary: messages.map((message) => `${message.from}: ${message.body}`).join(" "),
      citations: messages.map((message) => message.id),
    };
  }

  public createDraft(request: GmailDraftRequest): GmailDraft {
    this.requireScopes([GMAIL_DRAFT_SCOPE]);
    if (request.to.length === 0 || request.subject.trim() === "" || request.body.trim() === "" || request.idempotencyKey.trim() === "") {
      throw new ConnectorError("VALIDATION_ERROR", "A draft requires recipients, subject, body, and an idempotency key.");
    }
    const existingDraft = this.draftsByIdempotencyKey.get(request.idempotencyKey);
    if (existingDraft !== undefined) {
      return existingDraft;
    }
    const draft: GmailDraft = {
      id: `draft-${this.nextDraftNumber++}`,
      threadId: request.threadId,
      to: [...request.to],
      subject: request.subject,
      body: request.body,
      status: "draft",
    };
    this.draftsByIdempotencyKey.set(request.idempotencyKey, draft);
    return draft;
  }

  private requireScopes(scopes: readonly ConnectorScope[]): void {
    requireHealthyConnection(this.health, scopes, this.now());
  }
}

export function createMockGmailConnector(options: MockGmailConnectorOptions): MockGmailConnector {
  return new MockGmailConnector(options.health, options.messages, { now: options.now });
}
