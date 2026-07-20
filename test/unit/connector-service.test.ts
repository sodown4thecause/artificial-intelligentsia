import assert from "node:assert/strict";
import test from "node:test";
import { ConnectorService, type ConnectorManagementAuditEvent } from "../../src/connectors/service.js";
import { ConnectorError, type ConnectorHealth } from "../../src/connectors/types.js";
import { createMockVercelConnect } from "../../src/connectors/vercel-connect.js";

const now = new Date("2026-07-20T12:00:00.000Z");

function health(overrides: Partial<ConnectorHealth> = {}): ConnectorHealth {
  return {
    connectorId: "gmail-primary",
    provider: "gmail",
    enabled: true,
    status: "connected",
    grantedScopes: ["mail.read"],
    expiresAt: new Date("2026-07-21T12:00:00.000Z"),
    lastSuccessfulSyncAt: new Date("2026-07-20T11:00:00.000Z"),
    error: null,
    ...overrides,
  };
}

function setupService(connection = health()) {
  const audit: ConnectorManagementAuditEvent[] = [];
  return {
    audit,
    service: new ConnectorService({
      connectors: [createMockVercelConnect({ connections: [connection], now: () => now })],
      audit: (event) => { audit.push(event); },
      now: () => now,
    }),
  };
}

test("lists credential-free health and redacts connector errors", () => {
  const { service } = setupService(health({
    status: "error",
    error: { code: "CONNECTION_ERROR", message: "access_token=super-secret Bearer another-secret", reconnectRequired: true },
  }));
  const [result] = service.listHealth();
  assert.equal(result?.error?.message, "access_token=[REDACTED] Bearer [REDACTED]");
  assert.doesNotMatch(JSON.stringify(result), /super-secret/);
});

test("reports expired and disabled health without refreshing", () => {
  const expired = setupService(health({ status: "expired", expiresAt: new Date("2026-07-20T11:00:00.000Z") })).service;
  const disabled = setupService(health({ enabled: false, status: "disconnected" })).service;
  assert.equal(expired.getHealth("gmail-primary").status, "expired");
  assert.throws(() => expired.refresh("gmail-primary"), ConnectorError);
  assert.equal(disabled.getHealth("gmail-primary").enabled, false);
  assert.throws(() => disabled.refresh("gmail-primary"), /not enabled/);
});

test("enables, disables, and records each management action", () => {
  const { service, audit } = setupService();
  assert.equal(service.disable("gmail-primary").enabled, false);
  assert.equal(service.enable("gmail-primary").enabled, true);
  assert.deepEqual(audit.map((event) => event.action), ["disable", "enable"]);
  assert.ok(audit.every((event) => event.outcome === "success"));
});

test("refreshes a healthy connector and clears an error state", () => {
  const { service } = setupService(health({
    status: "error",
    error: { code: "CONNECTION_ERROR", message: "temporary provider failure", reconnectRequired: false },
  }));
  const refreshed = service.refresh("gmail-primary");
  assert.equal(refreshed.status, "connected");
  assert.deepEqual(refreshed.lastSuccessfulSyncAt, now);
  assert.equal(refreshed.error, null);
});

test("reconnects only with explicitly supplied existing scopes and redacts failure audits", () => {
  const { service, audit } = setupService();
  assert.deepEqual(service.reconnect("gmail-primary", ["mail.read"]).grantedScopes, ["mail.read"]);
  assert.throws(() => service.reconnect("gmail-primary", ["mail.read", "mail.send"]), /cannot add the ungranted scope/);
  const failure = audit.at(-1);
  assert.equal(failure?.action, "reconnect");
  assert.equal(failure?.outcome, "failure");
  assert.ok(failure?.error);
  assert.match(failure.error.message, /mail\.send/);
  assert.doesNotMatch(failure.error.message, /access[_-]?token|bearer|secret/i);
});

test("does not treat a missing scope as a valid reconnection", () => {
  const { service } = setupService(health({ grantedScopes: [] }));
  assert.throws(() => service.reconnect("gmail-primary", ["mail.read"]), /cannot add the ungranted scope/);
});
