import { InMemoryAuditStore } from './store.js';
import type { AuditEvent, AuditEventInput } from './types.js';

export const defaultAuditStore = new InMemoryAuditStore();

/** Records one immutable audit event from an agent lifecycle hook. */
export function recordAuditEvent(
  event: AuditEventInput,
  store: InMemoryAuditStore = defaultAuditStore,
): Readonly<AuditEvent> {
  return store.append(event);
}
