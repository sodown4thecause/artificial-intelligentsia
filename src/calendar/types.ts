import type { CalendarEvent as ConnectorCalendarEvent } from "../connectors/calendar.js";

export type CalendarEvent = ConnectorCalendarEvent;

export interface CalendarQuery {
  startsAt: Date;
  endsAt: Date;
}

export interface ExtractedEventDetails {
  title: string;
  startsAt: Date;
  endsAt: Date;
  attendees: readonly string[];
  location?: string;
  sourceMessageId?: string;
}

export type EventPreviewStatus = "pending" | "confirmed" | "cancelled";

/** A local-only proposal. It never creates an event in a connected calendar. */
export interface EventPreview {
  readonly id: string;
  readonly kind: "event-preview";
  readonly event: CalendarEvent;
  readonly extractedDetails: ExtractedEventDetails;
  readonly requiresConfirmation: true;
  readonly status: EventPreviewStatus;
  readonly createdAt: Date;
  readonly confirmedBy?: string;
  readonly confirmedAt?: Date;
}

export interface CalendarAuditEvent {
  operation: "read" | "extract" | "preview" | "confirm" | "cancel";
  targetId?: string;
  occurredAt: Date;
  outcome: "success" | "error";
}
