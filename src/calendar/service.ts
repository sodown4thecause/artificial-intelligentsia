import { GOOGLE_CALENDAR_READ_SCOPE, type CalendarConnector } from "../connectors/calendar.js";
import { requireHealthyConnection } from "../connectors/types.js";
import { buildEventPreview, cancelEventPreview, confirmEventPreview } from "./preview.js";
import type {
  CalendarAuditEvent,
  CalendarEvent,
  CalendarQuery,
  EventPreview,
  ExtractedEventDetails,
} from "./types.js";

export interface CalendarAuditLogger {
  record(event: CalendarAuditEvent): void;
}

export interface CalendarServiceOptions {
  auditLogger?: CalendarAuditLogger;
  now?: () => Date;
}

const secretPattern = /((?:api[_-]?key|token|password|secret)\s*[:=]\s*)([^\s,;]+)/gi;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export function redactCalendarSecrets(value: string): string {
  return value.replace(secretPattern, "$1[REDACTED]");
}

/** Permission-checked, read-only facade over a calendar connector. */
export class CalendarService {
  private readonly auditEvents: CalendarAuditEvent[] = [];
  private readonly now: () => Date;
  private readonly auditLogger: CalendarAuditLogger | undefined;
  private previewSequence = 0;

  public constructor(private readonly connector: CalendarConnector, options: CalendarServiceOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.auditLogger = options.auditLogger;
  }

  public getAuditEvents(): readonly CalendarAuditEvent[] {
    return [...this.auditEvents];
  }

  public listEvents(query: CalendarQuery): readonly CalendarEvent[] {
    return this.execute("read", undefined, () => {
      if (query.endsAt <= query.startsAt) throw new Error("The event range must end after it starts.");
      return this.connector.readEvents(query).map(redactEvent);
    });
  }

  public extractEventDetails(emailText: string, sourceMessageId?: string): ExtractedEventDetails {
    return this.execute("extract", sourceMessageId, () => extractEventDetails(emailText, sourceMessageId));
  }

  public createEventPreview(details: ExtractedEventDetails): EventPreview {
    return this.execute("preview", details.sourceMessageId, () => {
      const preview = buildEventPreview(redactDetails(details), {
        id: `event-preview-${++this.previewSequence}`,
        createdAt: this.now(),
      });
      // Keep connector validation and scope checks in the preview flow; this connector never writes.
      this.connector.previewEvent(preview.event);
      return preview;
    });
  }

  public confirmPreview(preview: EventPreview, confirmedBy = "user"): EventPreview {
    return this.execute("confirm", preview.id, () => confirmEventPreview(preview, confirmedBy, this.now()));
  }

  public cancelPreview(preview: EventPreview): EventPreview {
    return this.execute("cancel", preview.id, () => cancelEventPreview(preview));
  }

  private execute<T>(operation: CalendarAuditEvent["operation"], targetId: string | undefined, action: () => T): T {
    try {
      requireHealthyConnection(this.connector.getHealth(), [GOOGLE_CALENDAR_READ_SCOPE], this.now());
      const result = action();
      this.record(operation, targetId, "success");
      return result;
    } catch (error) {
      this.record(operation, targetId, "error");
      throw error;
    }
  }

  private record(operation: CalendarAuditEvent["operation"], targetId: string | undefined, outcome: CalendarAuditEvent["outcome"]): void {
    const event: CalendarAuditEvent = { operation, ...(targetId === undefined ? {} : { targetId }), occurredAt: this.now(), outcome };
    this.auditEvents.push(event);
    this.auditLogger?.record(event);
  }
}

function extractEventDetails(emailText: string, sourceMessageId?: string): ExtractedEventDetails {
  const text = redactCalendarSecrets(emailText);
  const title = extractTitle(text);
  const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const timeMatch = text.match(/\bfrom\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  const startsAt = parseDateTime(dateMatch?.[1], timeMatch?.[1], timeMatch?.[2], timeMatch?.[3]);
  const endsAt = parseDateTime(dateMatch?.[1], timeMatch?.[4], timeMatch?.[5], timeMatch?.[6]);
  const effectiveEnd = endsAt > startsAt ? endsAt : new Date(startsAt.getTime() + 60 * 60 * 1000);
  const attendees = [...new Set(text.match(emailPattern)?.map((email) => email.toLowerCase()) ?? [])];
  const location = text.match(/\b(?:at|location:)\s+([^\n,.]+)/i)?.[1]?.trim();
  return { title, startsAt, endsAt: effectiveEnd, attendees, ...(location === undefined ? {} : { location }), ...(sourceMessageId === undefined ? {} : { sourceMessageId }) };
}

function extractTitle(text: string): string {
  const subject = text.match(/^subject:\s*(.+)$/im)?.[1];
  const meeting = text.match(/(?:meeting|event|call)\s+(?:about|for|:)?\s*([^\n.]+?)(?:\s+on\s+\d{4}-\d{2}-\d{2}|$)/i)?.[1];
  return redactCalendarSecrets(subject ?? meeting ?? "Untitled event").trim() || "Untitled event";
}

function parseDateTime(date: string | undefined, hour: string | undefined, minute: string | undefined, meridiem: string | undefined): Date {
  if (date === undefined) return new Date(0);
  const [year, month, day] = date.split("-").map(Number);
  let parsedHour = Number(hour ?? 9);
  if (meridiem?.toLowerCase() === "pm" && parsedHour < 12) parsedHour += 12;
  if (meridiem?.toLowerCase() === "am" && parsedHour === 12) parsedHour = 0;
  return new Date(Date.UTC(year, month - 1, day, parsedHour, Number(minute ?? 0)));
}

function redactEvent(event: CalendarEvent): CalendarEvent {
  return { ...event, title: redactCalendarSecrets(event.title), attendees: event.attendees.map(redactCalendarSecrets) };
}

function redactDetails(details: ExtractedEventDetails): ExtractedEventDetails {
  return {
    ...details,
    title: redactCalendarSecrets(details.title),
    attendees: details.attendees.map(redactCalendarSecrets),
    ...(details.location === undefined ? {} : { location: redactCalendarSecrets(details.location) }),
  };
}
