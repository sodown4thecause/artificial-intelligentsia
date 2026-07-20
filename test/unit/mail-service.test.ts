import assert from "node:assert/strict";
import test from "node:test";
import { GMAIL_DRAFT_SCOPE, GMAIL_READ_SCOPE, createMockGmailConnector } from "../../src/connectors/gmail.js";
import { ConnectorError, type ConnectorHealth } from "../../src/connectors/types.js";
import { MailService } from "../../src/mail/service.js";

const health = (scopes = [GMAIL_READ_SCOPE, GMAIL_DRAFT_SCOPE]): ConnectorHealth => ({
  connectorId: "gmail-1", provider: "gmail", enabled: true, status: "connected", grantedScopes: scopes,
  expiresAt: null, lastSuccessfulSyncAt: null, error: null,
});
const messages = [{ id: "message-1", threadId: "thread-1", from: "customer@example.test", to: ["me@example.test"], subject: "Renewal", body: "token=super-secret please renew", receivedAt: new Date("2026-01-02T00:00:00Z"), labels: ["inbox"] }, { id: "message-2", threadId: "thread-1", from: "me@example.test", to: ["customer@example.test"], subject: "Renewal", body: "We will follow up.", receivedAt: new Date("2026-01-03T00:00:00Z"), labels: ["sent"] }];

test("checks Gmail health and scope before each mail operation", () => {
  const service = new MailService(createMockGmailConnector({ health: health([GMAIL_DRAFT_SCOPE]), messages }));
  assert.throws(() => service.searchMessages({ text: "renewal" }), (error: unknown) => error instanceof ConnectorError && error.code === "MISSING_SCOPE");
  assert.equal(service.getAuditEvents()[0]?.outcome, "error");
});

test("searches and groups threads, reads redacted messages, and audits operations", () => {
  const service = new MailService(createMockGmailConnector({ health: health(), messages }));
  const result = service.searchMessages({ text: "renew" });
  assert.equal(result.threads.length, 1);
  assert.equal(result.threads[0]?.messages.length, 2);
  assert.match(service.readMessage("message-1").body, /\[REDACTED\]/);
  assert.deepEqual(service.getAuditEvents().map((event) => event.operation), ["search", "read"]);
});

test("summarizes threads with message citations", () => {
  const service = new MailService(createMockGmailConnector({ health: health(), messages }));
  const summary = service.summarizeThread("thread-1");
  assert.equal(summary.citations.length, 2);
  assert.equal(summary.citations[0]?.messageId, "message-1");
  assert.match(summary.summary, /\[REDACTED\]/);
});

test("creates idempotent unsent drafts and requires approval for any hypothetical send", () => {
  const service = new MailService(createMockGmailConnector({ health: health(), messages }));
  const request = { threadId: "thread-1", to: ["customer@example.test"], subject: "Renewal", body: "secret=do-not-leak", idempotencyKey: "renewal-1" };
  const first = service.createDraft(request);
  const second = service.createDraft(request);
  assert.equal(first.status, "draft");
  assert.equal(first.id, second.id);
  assert.match(first.body, /\[REDACTED\]/);
  assert.throws(() => service.requireApprovalForExternalSend(first.id), /Explicit user approval/);
  service.approveDraft(first.id);
  assert.doesNotThrow(() => service.requireApprovalForExternalSend(first.id));
  assert.equal("send" in service, false);
});
