import assert from "node:assert/strict";
import test from "node:test";

import { GMAIL_DRAFT_SCOPE, GMAIL_READ_SCOPE, createMockGmailConnector } from "../../src/connectors/gmail.js";
import { ConnectorError, type ConnectorHealth } from "../../src/connectors/types.js";

const now = new Date("2026-07-20T12:00:00.000Z");
const health: ConnectorHealth = {
  connectorId: "gmail-main",
  provider: "gmail",
  enabled: true,
  status: "connected",
  grantedScopes: [GMAIL_READ_SCOPE, GMAIL_DRAFT_SCOPE],
  expiresAt: new Date("2026-07-21T12:00:00.000Z"),
  lastSuccessfulSyncAt: now,
  error: null,
};
const messages = [{
  id: "message-1", threadId: "thread-1", from: "alex@example.test", to: ["me@example.test"], subject: "Project plan", body: "Please review the project plan.", receivedAt: now, labels: ["INBOX"],
}];

test("Gmail read, search, and summary require read scope and cite canonical messages", () => {
  const gmail = createMockGmailConnector({ health, messages, now: () => now });
  assert.equal(gmail.readMessage("message-1").subject, "Project plan");
  assert.deepEqual(gmail.searchMessages({ text: "project" }).map((message) => message.id), ["message-1"]);
  assert.deepEqual(gmail.summarizeThread("thread-1").citations, ["message-1"]);
});

test("Gmail drafts are idempotent and never report a sent message", () => {
  const gmail = createMockGmailConnector({ health, messages, now: () => now });
  const request = { threadId: "thread-1", to: ["alex@example.test"], subject: "Re: Project plan", body: "I will review it.", idempotencyKey: "draft-thread-1-v1" };
  const first = gmail.createDraft(request);
  const retry = gmail.createDraft(request);
  assert.equal(first.id, retry.id);
  assert.equal(first.status, "draft");
});

test("Gmail rejects missing draft scope and expired sessions without exposing credentials", () => {
  const noDraftScope = createMockGmailConnector({ health: { ...health, grantedScopes: [GMAIL_READ_SCOPE] }, messages, now: () => now });
  assert.throws(() => noDraftScope.createDraft({ threadId: "thread-1", to: ["alex@example.test"], subject: "Re", body: "Draft", idempotencyKey: "key" }), (error: unknown) => error instanceof ConnectorError && error.code === "MISSING_SCOPE" && error.reconnectRequired);
  const expired = createMockGmailConnector({ health: { ...health, expiresAt: now }, messages, now: () => now });
  assert.throws(() => expired.readMessage("message-1"), (error: unknown) => error instanceof ConnectorError && error.code === "CONNECTION_EXPIRED" && !error.message.includes("Bearer"));
});
