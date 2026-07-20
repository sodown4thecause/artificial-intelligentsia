import assert from "node:assert/strict";
import test from "node:test";

type EventPreview = { title: string; startsAt: string; attendees: string[] };

class MockCalendar {
  readonly externalActions: string[] = [];

  previewFromEmail(body: string): EventPreview {
    assert.match(body, /Tuesday 10:00/);
    return { title: "Renewal review", startsAt: "2026-07-21T10:00:00Z", attendees: ["customer@example.test"] };
  }

  async create(preview: EventPreview, confirmed: boolean): Promise<void> {
    if (!confirmed) throw new Error("Confirmation is required before creating an event");
    this.externalActions.push(`create:${preview.title}`);
  }
}

test("extracts an event from email and requires confirmation before calendar creation", async () => {
  const calendar = new MockCalendar();
  const preview = calendar.previewFromEmail("Let's hold the renewal review Tuesday 10:00 with customer@example.test.");

  assert.deepEqual(preview, {
    title: "Renewal review",
    startsAt: "2026-07-21T10:00:00Z",
    attendees: ["customer@example.test"],
  });
  await assert.rejects(() => calendar.create(preview, false), /Confirmation is required/);
  assert.deepEqual(calendar.externalActions, []);

  await calendar.create(preview, true);
  assert.deepEqual(calendar.externalActions, ["create:Renewal review"]);
});
