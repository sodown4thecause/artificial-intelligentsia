import {
  type ConnectorHealth,
  type ConnectorScope,
  ConnectorError,
  requireHealthyConnection,
} from "./types.js";

export const GOOGLE_CALENDAR_READ_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  attendees: readonly string[];
  sourceMessageId?: string;
}

export interface CalendarEventPreview {
  readonly kind: "event-preview";
  readonly event: CalendarEvent;
  readonly requiresApproval: true;
  readonly createsEvent: false;
}

export interface CalendarConnector {
  getHealth(): ConnectorHealth;
  readEvents(range: { startsAt: Date; endsAt: Date }): readonly CalendarEvent[];
  previewEvent(event: CalendarEvent): CalendarEventPreview;
}

export interface MockCalendarConnectorOptions {
  health: ConnectorHealth;
  events: readonly CalendarEvent[];
  now?: () => Date;
}

/** A read-only calendar double: previews deliberately do not create events or invitations. */
export class MockCalendarConnector implements CalendarConnector {
  private readonly now: () => Date;

  public constructor(private health: ConnectorHealth, private readonly events: readonly CalendarEvent[], options?: Pick<MockCalendarConnectorOptions, "now">) {
    this.now = options?.now ?? (() => new Date());
  }

  public getHealth(): ConnectorHealth {
    return this.health;
  }

  public readEvents(range: { startsAt: Date; endsAt: Date }): readonly CalendarEvent[] {
    this.requireScopes([GOOGLE_CALENDAR_READ_SCOPE]);
    if (range.endsAt <= range.startsAt) {
      throw new ConnectorError("VALIDATION_ERROR", "The event range must end after it starts.");
    }
    return this.events.filter((event) => event.startsAt < range.endsAt && event.endsAt > range.startsAt);
  }

  public previewEvent(event: CalendarEvent): CalendarEventPreview {
    this.requireScopes([GOOGLE_CALENDAR_READ_SCOPE]);
    if (event.title.trim() === "" || event.endsAt <= event.startsAt) {
      throw new ConnectorError("VALIDATION_ERROR", "An event preview requires a title and a valid time range.");
    }
    return { kind: "event-preview", event: { ...event, attendees: [...event.attendees] }, requiresApproval: true, createsEvent: false };
  }

  private requireScopes(scopes: readonly ConnectorScope[]): void {
    requireHealthyConnection(this.health, scopes, this.now());
  }
}

export function createMockCalendarConnector(options: MockCalendarConnectorOptions): MockCalendarConnector {
  return new MockCalendarConnector(options.health, options.events, { now: options.now });
}
