import { scrubForPersistence } from '../security/secrets';
export class AuditLog {
    events = [];
    sinks = [];
    addSink(sink) {
        this.sinks.push(sink);
    }
    record(event) {
        const full = {
            ...event,
            // Reference sensitive content by secure id, never full value.
            inputs: scrubForPersistence(event.inputs),
            externalChanges: (event.externalChanges ?? []).map((c) => (isSecretLike(c) ? `[SECURE_ID:${hash(c)}]` : c)),
            id: `aud_${Math.random().toString(36).slice(2, 11)}`,
            at: Date.now(),
        };
        this.events.push(full);
        for (const sink of this.sinks)
            sink.persist(full);
        return full;
    }
    query(filter = {}) {
        return this.events.filter((e) => {
            if (filter.since != null && e.at < filter.since)
                return false;
            if (filter.until != null && e.at > filter.until)
                return false;
            if (filter.actor && filter.actor !== e.actor)
                return false;
            if (filter.actorContains && !e.actor.toLowerCase().includes(filter.actorContains.toLowerCase()))
                return false;
            if (filter.agent && filter.agent !== e.agent)
                return false;
            if (filter.trigger && filter.trigger !== e.trigger)
                return false;
            return true;
        });
    }
    all() {
        return [...this.events];
    }
}
function isSecretLike(s) {
    return /token|secret|password|credential|key/i.test(s);
}
function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++)
        h = (h << 5) - h + s.charCodeAt(i);
    return (h >>> 0).toString(36);
}
export const auditLog = new AuditLog();
//# sourceMappingURL=auditLog.js.map