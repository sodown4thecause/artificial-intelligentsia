import { createHash, randomBytes } from 'node:crypto';

import {
  AuditEventSchema,
  AuditEventInputSchema,
  type AuditEvent,
  type AuditEventInput,
  type AuditTimeRange,
} from './types.js';

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(',')}}`;
}

function hashEvent(event: Omit<AuditEvent, 'hash'>): string {
  return createHash('sha256').update(canonicalize(event)).digest('hex');
}

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      freezeDeep(child);
    }
  }
  return value;
}

function rangeBoundary(value: Date | string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const milliseconds = value instanceof Date ? value.getTime() : Date.parse(value);
  if (Number.isNaN(milliseconds)) {
    throw new RangeError('Audit time range values must be valid dates');
  }
  return milliseconds;
}

/** Phase 0 audit log. A durable implementation can preserve this API. */
export class InMemoryAuditStore {
  private readonly events: AuditEvent[] = [];

  append(input: AuditEventInput): Readonly<AuditEvent> {
    const parsed = AuditEventInputSchema.parse(input);
    const previousHash = this.events.at(-1)?.hash ?? null;
    const unsignedEvent = {
      ...parsed,
      id: `audit_evt_${randomBytes(24).toString('base64url')}`,
      occurredAt: parsed.occurredAt ?? new Date().toISOString(),
      previousHash,
    };
    const event = AuditEventSchema.parse({
      ...unsignedEvent,
      hash: hashEvent(unsignedEvent),
    });

    this.events.push(freezeDeep(event));
    return event;
  }

  getByRunId(runId: string): readonly Readonly<AuditEvent>[] {
    return Object.freeze(this.events.filter((event) => event.runId === runId));
  }

  getByActor(actorId: string): readonly Readonly<AuditEvent>[] {
    return Object.freeze(this.events.filter((event) => event.actor.id === actorId));
  }

  getByTimeRange(range: AuditTimeRange): readonly Readonly<AuditEvent>[] {
    const from = rangeBoundary(range.from);
    const to = rangeBoundary(range.to);
    if (from !== undefined && to !== undefined && from > to) {
      throw new RangeError('Audit time range start must not be after its end');
    }

    return Object.freeze(
      this.events.filter((event) => {
        const timestamp = Date.parse(event.occurredAt);
        return (from === undefined || timestamp >= from) && (to === undefined || timestamp <= to);
      }),
    );
  }
}
