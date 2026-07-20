import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CalendarView } from "../../src/ui/components/CalendarView.js";

test("renders calendar events and highlights the selected event", () => {
  const markup = renderToStaticMarkup(<CalendarView
    events={[{ id: "event-1", title: "Planning token=hidden", startsAt: new Date("2026-07-22T09:00:00.000Z"), endsAt: new Date("2026-07-22T10:00:00.000Z"), attendees: [] }]}
    selectedEventId="event-1"
    extractedDetails={{ title: "From email", startsAt: new Date("2026-07-23T09:00:00.000Z"), endsAt: new Date("2026-07-23T10:00:00.000Z"), attendees: [] }}
    onSelectEvent={() => undefined}
  />);
  assert.match(markup, /Planning token=\[REDACTED\]/);
  assert.match(markup, /aria-pressed="true"/);
  assert.match(markup, /Extracted event details/);
});
