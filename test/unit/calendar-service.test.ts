import assert from "node:assert/strict";
import test from "node:test";
import { createMockCalendarConnector, GOOGLE_CALENDAR_READ_SCOPE } from "../../src/connectors/calendar.js";
import type { ConnectorHealth } from "../../src/connectors/types.js";
import { CalendarService } from "../../src/calendar/service.js";

const startsAt = new Date("2026-07-22T09:00:00.000Z");
const endsAt = new Date("2026-07-22T10:00:00.000Z");
const health: ConnectorHealth = {
  connectorId: "calendar-1",
  provider: "google",
  enabled: true,
  status: "connected",
  grantedScopes: [GOOGLE_CALENDAR_READ_SCOPE],
  expiresAt: null,
  lastSuccessfulSyncAt: new Date("2026-07-20T00:00:00.000Z"),
  error: null,
};

function createService() {
  return new CalendarService(createMockCalendarConnector({
    health,
    events: [{ id: "event-1", title: "Planning token=secret-value", startsAt, endsAt, attendees: ["team@example.com"] }],
  }), { now: () => new Date("2026-07-20T00:00:00.000Z") });
}

test("lists permission-checked events and redacts secret values", () => {
  const service = createService();
  const events = service.listEvents({ startsAt: new Date("2026-07-22T00:00:00.000Z"), endsAt: new Date("2026-07-23T00:00:00.000Z") });
  assert.equal(events.length, 1);
  assert.equal(events[0]?.title, "Planning token=[REDACTED]");
  assert.equal(service.getAuditEvents()[0]?.operation, "read");
});

test("rejects calendar operations when the read scope is absent", () => {
  const service = new CalendarService(createMockCalendarConnector({
    health: { ...health, grantedScopes: [] },
    events: [],
  }));
  assert.throws(() => service.listEvents({ startsAt, endsAt }));
  assert.equal(service.getAuditEvents()[0]?.outcome, "error");
});

test("extracts an event proposal from email text", () => {
  const service = createService();
  const details = service.extractEventDetails(
    "Subject: Product sync\nMeeting for roadmap on 2026-07-22 from 9:00am to 10:30am with ada@example.com at Room 2. token=do-not-render",
    "message-1",
  );
  assert.equal(details.title, "Product sync");
  assert.equal(details.startsAt.toISOString(), "2026-07-22T09:00:00.000Z");
  assert.equal(details.endsAt.toISOString(), "2026-07-22T10:30:00.000Z");
  assert.deepEqual(details.attendees, ["ada@example.com"]);
  assert.equal(details.sourceMessageId, "message-1");
  assert.equal(service.getAuditEvents()[0]?.operation, "extract");
});

test("keeps event previews pending until an explicit confirmation", () => {
  const service = createService();
  const preview = service.createEventPreview({ title: "Roadmap", startsAt, endsAt, attendees: [] });
  assert.equal(preview.requiresConfirmation, true);
  assert.equal(preview.status, "pending");
  const confirmed = service.confirmPreview(preview, "ada");
  assert.equal(confirmed.status, "confirmed");
  assert.equal(confirmed.confirmedBy, "ada");
  assert.deepEqual(service.getAuditEvents().map((event) => event.operation), ["preview", "confirm"]);
});
