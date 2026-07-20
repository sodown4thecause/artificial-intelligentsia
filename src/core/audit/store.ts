import { createHash, randomBytes } from 'node:crypto';

import {
  AuditEventSchema,
  AuditEventInputSchema,
  type AuditEvent,
  type AuditEventInput,
  type AuditTimeRange,
} from './types.js';
import { assertCanReadAuditWorkspace, type AuditAccessPrincipal } from './access.js';
import type { AuditQuery } from './query.js';

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

export function hashAuditEvent(event: Omit<AuditEvent, 'hash'>): string {
  return createHash('sha256').update(canonicalize(event)).digest('hex');
}

/** Returns false when an event's contents or its chain predecessor were modified. */
export function verifyAuditEventChain(events: readonly AuditEvent[]): boolean {
  let previousHash: string | null = null;

  return events.every((event) => {
    const { hash, ...unsignedEvent } = event;
    const valid = event.previousHash === previousHash && hashAuditEvent(unsignedEvent) === hash;
    previousHash = event.hash;
    return valid;
  });
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

/** Append-only, immutable audit log with authorization-scoped reads. */
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
       hash: hashAuditEvent(unsignedEvent),
    });

    this.events.push(freezeDeep(event));
    return event;
  }

  query(principal: AuditAccessPrincipal, query: AuditQuery): readonly Readonly<AuditEvent>[] {
    assertCanReadAuditWorkspace(principal, query.workspaceId);
    const from = rangeBoundary(query.timeRange?.from);
    const to = rangeBoundary(query.timeRange?.to);
    if (from !== undefined && to !== undefined && from > to) {
      throw new RangeError('Audit time range start must not be after its end');
    }

    return Object.freeze(
      this.events.filter((event) => {
        if (event.workspaceId !== query.workspaceId) {
          return false;
        }
        if (query.runId !== undefined && event.runId !== query.runId) {
          return false;
        }
        if (query.actorId !== undefined && event.actor.id !== query.actorId) {
          return false;
        }
        const timestamp = Date.parse(event.occurredAt);
        return (from === undefined || timestamp >= from) && (to === undefined || timestamp <= to);
      }),
    );
  }

  getByRunId(
    principal: AuditAccessPrincipal,
    workspaceId: string,
    runId: string,
  ): readonly Readonly<AuditEvent>[] {
    return this.query(principal, { workspaceId, runId });
  }

  getByActor(
    principal: AuditAccessPrincipal,
    workspaceId: string,
    actorId: string,
  ): readonly Readonly<AuditEvent>[] {
    return this.query(principal, { workspaceId, actorId });
  }

  getByTimeRange(
    principal: AuditAccessPrincipal,
    workspaceId: string,
    range: AuditTimeRange,
  ): readonly Readonly<AuditEvent>[] {
    return this.query(principal, { workspaceId, timeRange: range });
  }

  getByWorkspace(
    principal: AuditAccessPrincipal,
    workspaceId: string,
  ): readonly Readonly<AuditEvent>[] {
    return this.query(principal, { workspaceId });
  }

  verifyIntegrity(): boolean {
    return verifyAuditEventChain(this.events);
  }
}
