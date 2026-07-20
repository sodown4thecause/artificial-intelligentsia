import assert from "node:assert/strict";
import test from "node:test";

import { GOOGLE_CALENDAR_READ_SCOPE, createMockCalendarConnector } from "../../src/connectors/calendar.js";
import { ConnectorError, type ConnectorHealth } from "../../src/connectors/types.js";

const now = new Date("2026-07-20T12:00:00.000Z");
const health: ConnectorHealth = { connectorId: "calendar-main", provider: "google-calendar", enabled: true, status: "connected", grantedScopes: [GOOGLE_CALENDAR_READ_SCOPE], expiresAt: null, lastSuccessfulSyncAt: now, error: null };
const event = { id: "event-1", title: "Planning", startsAt: new Date("2026-07-21T09:00:00.000Z"), endsAt: new Date("2026-07-21T10:00:00.000Z"), attendees: ["alex@example.test"], sourceMessageId: "message-1" };

test("Google Calendar reads events in the requested range", () => {
  const calendar = createMockCalendarConnector({ health, events: [event], now: () => now });
  assert.deepEqual(calendar.readEvents({ startsAt: new Date("2026-07-21T08:00:00.000Z"), endsAt: new Date("2026-07-21T11:00:00.000Z") }).map((item) => item.id), ["event-1"]);
});

test("Google Calendar event previews require approval and do not create events", () => {
  const calendar = createMockCalendarConnector({ health, events: [], now: () => now });
  const preview = calendar.previewEvent(event);
  assert.equal(preview.kind, "event-preview");
  assert.equal(preview.requiresApproval, true);
  assert.equal(preview.createsEvent, false);
});

test("Google Calendar rejects missing scope and invalid preview data", () => {
  const noScope = createMockCalendarConnector({ health: { ...health, grantedScopes: [] }, events: [], now: () => now });
  assert.throws(() => noScope.readEvents({ startsAt: now, endsAt: new Date("2026-07-21T00:00:00.000Z") }), (error: unknown) => error instanceof ConnectorError && error.code === "MISSING_SCOPE");
  const calendar = createMockCalendarConnector({ health, events: [], now: () => now });
  assert.throws(() => calendar.previewEvent({ ...event, endsAt: event.startsAt }), (error: unknown) => error instanceof ConnectorError && error.code === "VALIDATION_ERROR");
});
