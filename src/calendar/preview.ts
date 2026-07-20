import type { CalendarEvent } from "./types.js";
import type { EventPreview, ExtractedEventDetails } from "./types.js";

export interface EventPreviewBuildOptions {
  id: string;
  createdAt: Date;
}

/** Builds a proposal only; callers must explicitly confirm it before a future write can occur. */
export function buildEventPreview(
  details: ExtractedEventDetails,
  options: EventPreviewBuildOptions,
): EventPreview {
  const event: CalendarEvent = {
    id: options.id,
    title: details.title,
    startsAt: new Date(details.startsAt),
    endsAt: new Date(details.endsAt),
    attendees: [...details.attendees],
    ...(details.sourceMessageId === undefined ? {} : { sourceMessageId: details.sourceMessageId }),
  };

  return {
    id: options.id,
    kind: "event-preview",
    event,
    extractedDetails: cloneDetails(details),
    requiresConfirmation: true,
    status: "pending",
    createdAt: new Date(options.createdAt),
  };
}

export function confirmEventPreview(preview: EventPreview, confirmedBy: string, confirmedAt: Date): EventPreview {
  if (preview.status !== "pending") throw new Error(`Preview ${preview.id} is no longer awaiting confirmation.`);
  if (confirmedBy.trim() === "") throw new Error("A confirming user is required.");
  return { ...preview, status: "confirmed", confirmedBy, confirmedAt: new Date(confirmedAt) };
}

export function cancelEventPreview(preview: EventPreview): EventPreview {
  if (preview.status !== "pending") throw new Error(`Preview ${preview.id} is no longer awaiting confirmation.`);
  return { ...preview, status: "cancelled" };
}

function cloneDetails(details: ExtractedEventDetails): ExtractedEventDetails {
  return {
    ...details,
    startsAt: new Date(details.startsAt),
    endsAt: new Date(details.endsAt),
    attendees: [...details.attendees],
  };
}
