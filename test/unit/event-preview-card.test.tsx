import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { buildEventPreview } from "../../src/calendar/preview.js";
import { EventPreviewCard } from "../../src/ui/components/EventPreviewCard.js";

test("renders a redacted confirmation-required event preview", () => {
  const preview = buildEventPreview({
    title: "Planning secret=hidden",
    startsAt: new Date("2026-07-22T09:00:00.000Z"),
    endsAt: new Date("2026-07-22T10:00:00.000Z"),
    attendees: ["ada@example.com"],
  }, { id: "preview-1", createdAt: new Date("2026-07-20T00:00:00.000Z") });
  const markup = renderToStaticMarkup(<EventPreviewCard preview={preview} onConfirm={() => undefined} onCancel={() => undefined} />);
  assert.match(markup, /Planning secret=\[REDACTED\]/);
  assert.match(markup, /Confirmation is required/);
  assert.match(markup, />Confirm</);
  assert.match(markup, />Cancel</);
});
