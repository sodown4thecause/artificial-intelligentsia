import type { AuditAccessPrincipal } from './access.js';
import type { InMemoryAuditStore } from './store.js';
import type { AuditEvent, AuditTimeRange } from './types.js';

/** Every audit query is constrained to one workspace before records are read. */
export interface AuditQuery {
  workspaceId: string;
  runId?: string;
  actorId?: string;
  timeRange?: AuditTimeRange;
}

export function queryAuditEvents(
  store: InMemoryAuditStore,
  principal: AuditAccessPrincipal,
  query: AuditQuery,
): readonly Readonly<AuditEvent>[] {
  return store.query(principal, query);
}

export function queryAuditEventsByRunId(
  store: InMemoryAuditStore,
  principal: AuditAccessPrincipal,
  workspaceId: string,
  runId: string,
): readonly Readonly<AuditEvent>[] {
  return queryAuditEvents(store, principal, { workspaceId, runId });
}

export function queryAuditEventsByActor(
  store: InMemoryAuditStore,
  principal: AuditAccessPrincipal,
  workspaceId: string,
  actorId: string,
): readonly Readonly<AuditEvent>[] {
  return queryAuditEvents(store, principal, { workspaceId, actorId });
}

export function queryAuditEventsByTimeRange(
  store: InMemoryAuditStore,
  principal: AuditAccessPrincipal,
  workspaceId: string,
  timeRange: AuditTimeRange,
): readonly Readonly<AuditEvent>[] {
  return queryAuditEvents(store, principal, { workspaceId, timeRange });
}
