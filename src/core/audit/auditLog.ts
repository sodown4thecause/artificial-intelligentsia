// PRD §13.3 — Auditability. In-memory store with a persistence interface for later Postgres/object storage (§12.6).
import type { AuditEvent } from '../types';
import { scrubForPersistence } from '../security/secrets';

export interface AuditSink {
  persist(event: AuditEvent): Promise<void> | void;
}

type AuditFilter = Partial<Omit<AuditEvent, 'id' | 'at'>> & {
  since?: number;
  until?: number;
  actorContains?: string;
};

export class AuditLog {
  private events: AuditEvent[] = [];
  private sinks: AuditSink[] = [];

  addSink(sink: AuditSink): void {
    this.sinks.push(sink);
  }

  record(event: Omit<AuditEvent, 'id' | 'at'>): AuditEvent {
    const full: AuditEvent = {
      ...event,
      // Reference sensitive content by secure id, never full value.
      inputs: scrubForPersistence(event.inputs),
      externalChanges: (event.externalChanges ?? []).map((c) => (isSecretLike(c) ? `[SECURE_ID:${hash(c)}]` : c)),
      id: `aud_${Math.random().toString(36).slice(2, 11)}`,
      at: Date.now(),
    };
    this.events.push(full);
    for (const sink of this.sinks) sink.persist(full);
    return full;
  }

  query(filter: AuditFilter = {}): AuditEvent[] {
    return this.events.filter((e) => {
      if (filter.since != null && e.at < filter.since) return false;
      if (filter.until != null && e.at > filter.until) return false;
      if (filter.actor && filter.actor !== e.actor) return false;
      if (filter.actorContains && !e.actor.toLowerCase().includes(filter.actorContains.toLowerCase())) return false;
      if (filter.agent && filter.agent !== e.agent) return false;
      if (filter.trigger && filter.trigger !== e.trigger) return false;
      return true;
    });
  }

  all(): AuditEvent[] {
    return [...this.events];
  }
}

function isSecretLike(s: string): boolean {
  return /token|secret|password|credential|key/i.test(s);
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export const auditLog = new AuditLog();
