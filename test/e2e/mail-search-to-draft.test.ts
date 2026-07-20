import assert from "node:assert/strict";
import test from "node:test";
import { GMAIL_DRAFT_SCOPE, GMAIL_READ_SCOPE, createMockGmailConnector } from "../../src/connectors/gmail.js";
import { MailService } from "../../src/mail/service.js";

test("searches Gmail, summarizes a cited thread, and drafts without a send capability", () => {
  const service = new MailService(createMockGmailConnector({ health: { connectorId: "gmail-1", provider: "gmail", enabled: true, status: "connected", grantedScopes: [GMAIL_READ_SCOPE, GMAIL_DRAFT_SCOPE], expiresAt: null, lastSuccessfulSyncAt: null, error: null }, messages: [{ id: "message-1", threadId: "thread-1", from: "customer@example.test", to: ["me@example.test"], subject: "Renewal", body: "Can we renew for another year?", receivedAt: new Date(), labels: ["inbox"] }, { id: "message-2", threadId: "thread-1", from: "me@example.test", to: ["customer@example.test"], subject: "Renewal", body: "Yes, please send terms.", receivedAt: new Date(), labels: ["sent"] }] }));
  const [thread] = service.searchMessages({ from: "customer@example.test", text: "renew" }).threads;
  assert.ok(thread);
  const summary = service.summarizeThread(thread.id);
  const draft = service.createDraft({ threadId: thread.id, to: ["customer@example.test"], subject: "Renewal terms", body: `${summary.summary}\n\nWe will send the renewal terms shortly.`, idempotencyKey: "e2e-renewal" });
  assert.equal(summary.citations.length, 2);
  assert.equal(draft.status, "draft");
  assert.throws(() => service.requireApprovalForExternalSend(draft.id), /Explicit user approval/);
  assert.equal("send" in service, false);
});
