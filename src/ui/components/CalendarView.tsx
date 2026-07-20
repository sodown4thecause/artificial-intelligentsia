import React from "react";
import type { CalendarEvent, ExtractedEventDetails } from "../../calendar/types.js";
import { redactCalendarSecrets } from "../../calendar/service.js";

export interface CalendarViewProps {
  events: readonly CalendarEvent[];
  selectedEventId?: string;
  extractedDetails?: ExtractedEventDetails;
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarView({ events, selectedEventId, extractedDetails, onSelectEvent }: CalendarViewProps): React.JSX.Element {
  return <section aria-label="Calendar events">
    <h2>Calendar</h2>
    <ul>
      {events.map((event) => <li key={event.id}>
        <button type="button" aria-pressed={event.id === selectedEventId} onClick={() => onSelectEvent(event)}>
          {redactCalendarSecrets(event.title)} — {event.startsAt.toISOString()}
        </button>
      </li>)}
    </ul>
    {extractedDetails === undefined ? null : <aside aria-label="Extracted event details">
      <h3>{redactCalendarSecrets(extractedDetails.title)}</h3>
      <p>{extractedDetails.startsAt.toISOString()} to {extractedDetails.endsAt.toISOString()}</p>
    </aside>}
  </section>;
}
