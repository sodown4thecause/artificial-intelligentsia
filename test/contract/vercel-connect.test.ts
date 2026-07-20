import assert from "node:assert/strict";
import test from "node:test";

import { createMockVercelConnect } from "../../src/connectors/vercel-connect.js";
import { ConnectorError, type ConnectorHealth } from "../../src/connectors/types.js";

const health: ConnectorHealth = {
  connectorId: "gmail-main",
  provider: "gmail",
  enabled: true,
  status: "expired",
  grantedScopes: ["scope.read"],
  expiresAt: new Date("2026-07-19T12:00:00.000Z"),
  lastSuccessfulSyncAt: new Date("2026-07-18T12:00:00.000Z"),
  error: { code: "CONNECTION_EXPIRED", message: "The connector session has expired. Reconnect to continue.", reconnectRequired: true },
};

test("Vercel Connect exposes health metadata without credential material", () => {
  const connect = createMockVercelConnect({ connections: [health], now: () => new Date("2026-07-20T12:00:00.000Z") });
  const serializedHealth = JSON.stringify(connect.getHealth("gmail-main"));
  assert.equal(serializedHealth.includes("access_token"), false);
  assert.equal(serializedHealth.includes("refresh_token"), false);
  assert.throws(() => connect.requireScopes("gmail-main", ["scope.read"]), (error: unknown) => error instanceof ConnectorError && error.code === "CONNECTION_EXPIRED" && error.reconnectRequired);
});

test("Vercel Connect reconnects explicitly and requires newly granted scopes", () => {
  const connect = createMockVercelConnect({ connections: [health] });
  const reconnected = connect.reconnect("gmail-main", ["scope.read", "scope.compose"]);
  assert.equal(reconnected.status, "connected");
  assert.equal(reconnected.error, null);
  assert.doesNotThrow(() => connect.requireScopes("gmail-main", ["scope.compose"]));
});
