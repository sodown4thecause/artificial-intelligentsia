import React from "react";
import type { EventPreview } from "../../calendar/types.js";
import { redactCalendarSecrets } from "../../calendar/service.js";

export interface EventPreviewCardProps {
  preview: EventPreview;
  onConfirm: (preview: EventPreview) => void;
  onCancel: (preview: EventPreview) => void;
}

export function EventPreviewCard({ preview, onConfirm, onCancel }: EventPreviewCardProps): React.JSX.Element {
  const { extractedDetails: details } = preview;
  const pending = preview.status === "pending";
  return <section aria-label="Event preview">
    <h2>{redactCalendarSecrets(details.title)}</h2>
    <dl>
      <dt>Starts</dt><dd>{details.startsAt.toISOString()}</dd>
      <dt>Ends</dt><dd>{details.endsAt.toISOString()}</dd>
      <dt>Attendees</dt><dd>{details.attendees.map(redactCalendarSecrets).join(", ") || "None"}</dd>
      {details.location === undefined ? null : <><dt>Location</dt><dd>{redactCalendarSecrets(details.location)}</dd></>}
    </dl>
    {pending ? <p>Confirmation is required before this event can be created.</p> : <p>Preview {preview.status}.</p>}
    <button type="button" onClick={() => onConfirm(preview)} disabled={!pending}>Confirm</button>
    <button type="button" onClick={() => onCancel(preview)} disabled={!pending}>Cancel</button>
  </section>;
}
