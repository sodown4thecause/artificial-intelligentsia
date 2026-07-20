import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ConnectorRow } from "../../src/ui/components/ConnectorSettings.js";
import type { ConnectorHealth } from "../../src/connectors/types.js";

const connector: ConnectorHealth = {
  connectorId: "calendar-primary",
  provider: "Google Calendar",
  enabled: true,
  status: "error",
  grantedScopes: ["calendar.read"],
  expiresAt: new Date("2026-07-21T12:00:00.000Z"),
  lastSuccessfulSyncAt: new Date("2026-07-20T11:00:00.000Z"),
  error: { code: "CONNECTION_ERROR", message: "Provider request failed", reconnectRequired: true },
};

function render(value: ConnectorHealth): string {
  return renderToStaticMarkup(
    <ConnectorRow
      connector={value}
      onEnable={async () => undefined}
      onDisable={async () => undefined}
      onRefresh={async () => undefined}
      onReconnect={async () => undefined}
    />,
  );
}

test("shows provider health, scopes, dates, and sanitized provider errors", () => {
  const html = render(connector);
  assert.match(html, /Google Calendar/);
  assert.match(html, /error/);
  assert.match(html, /calendar\.read/);
  assert.match(html, /Provider request failed/);
  assert.match(html, /Token expiry/);
  assert.match(html, /Last sync/);
});

test("offers explicit disable, refresh, and reconnect actions without changing scopes", () => {
  const html = render(connector);
  assert.match(html, />Disable</);
  assert.match(html, />Refresh</);
  assert.match(html, />Reconnect</);
  assert.match(html, /calendar\.read/);
});

test("switches a disabled connector to an enable action", () => {
  const html = render({ ...connector, enabled: false, status: "disconnected" });
  assert.match(html, />Enable</);
  assert.match(html, /disabled=""/);
});
