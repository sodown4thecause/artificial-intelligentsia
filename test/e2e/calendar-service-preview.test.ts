import assert from "node:assert/strict";
import test from "node:test";
import { CalendarService } from "../../src/calendar/service.js";
import { createMockCalendarConnector, GOOGLE_CALENDAR_READ_SCOPE } from "../../src/connectors/calendar.js";

test("email extraction produces a confirmation-gated calendar preview without creating an event", () => {
  const service = new CalendarService(createMockCalendarConnector({
    health: { connectorId: "calendar-1", provider: "google", enabled: true, status: "connected", grantedScopes: [GOOGLE_CALENDAR_READ_SCOPE], expiresAt: null, lastSuccessfulSyncAt: new Date("2026-07-20T00:00:00.000Z"), error: null },
    events: [],
  }));
  const details = service.extractEventDetails("Subject: Design review\n2026-07-22 from 14:00 to 15:00", "mail-1");
  const preview = service.createEventPreview(details);
  assert.equal(preview.status, "pending");
  assert.equal(preview.event.sourceMessageId, "mail-1");
  assert.equal(service.listEvents({ startsAt: new Date("2026-07-22T00:00:00.000Z"), endsAt: new Date("2026-07-23T00:00:00.000Z") }).length, 0);
});
