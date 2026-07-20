import { useCallback, useState } from "react";
import type { CalendarService } from "../../calendar/service.js";
import type { CalendarEvent, CalendarQuery, EventPreview, ExtractedEventDetails } from "../../calendar/types.js";

export function useCalendar(service: CalendarService) {
  const [events, setEvents] = useState<readonly CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [extractedDetails, setExtractedDetails] = useState<ExtractedEventDetails | undefined>();
  const [preview, setPreview] = useState<EventPreview | undefined>();

  const listEvents = useCallback((query: CalendarQuery) => {
    const nextEvents = service.listEvents(query);
    setEvents(nextEvents);
    return nextEvents;
  }, [service]);
  const extractFromEmail = useCallback((emailText: string, sourceMessageId?: string) => {
    const details = service.extractEventDetails(emailText, sourceMessageId);
    setExtractedDetails(details);
    return details;
  }, [service]);
  const createPreview = useCallback((details: ExtractedEventDetails) => {
    const nextPreview = service.createEventPreview(details);
    setPreview(nextPreview);
    return nextPreview;
  }, [service]);
  const confirmPreview = useCallback((currentPreview: EventPreview, confirmedBy?: string) => {
    const nextPreview = service.confirmPreview(currentPreview, confirmedBy);
    setPreview(nextPreview);
    return nextPreview;
  }, [service]);
  const cancelPreview = useCallback((currentPreview: EventPreview) => {
    const nextPreview = service.cancelPreview(currentPreview);
    setPreview(nextPreview);
    return nextPreview;
  }, [service]);

  return { events, selectedEvent, extractedDetails, preview, selectEvent: setSelectedEvent, listEvents, extractFromEmail, createPreview, confirmPreview, cancelPreview };
}
