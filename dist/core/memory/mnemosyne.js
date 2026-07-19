import { ok, err } from '../types';
import { SensitiveContentFilter } from './sensitiveFilter';
const PROHIBITED_CANONICAL = [
    'email',
    'canonical document',
    'database record',
    'audit log',
    'approval record',
    'git history',
    'credential',
    'secret',
];
// MEM-002: scoped memory categories (personal-preference, writing-voice, communication-preference,
// project-context, workspace-terminology, reusable-procedure, relationship-context).
// MEM-003: user controls — review, correct, pin, change scope, disable category, delete, export, disable entirely.
export class Mnemosyne {
    items = new Map();
    disabledUsers = new Set();
    filter = new SensitiveContentFilter();
    /** MEM-004 — memory must not replace canonical sources. */
    assertNotCanonical(value) {
        const v = value.toLowerCase();
        for (const c of PROHIBITED_CANONICAL) {
            if (v.includes(c) && v.length < 80)
                return err(`Refusing to store canonical source reference: ${c}`);
        }
        return ok(undefined);
    }
    retrieve(query = {}) {
        return Array.from(this.items.values()).filter((m) => {
            if (query.category && m.category !== query.category)
                return false;
            if (query.scope && m.scope !== query.scope)
                return false;
            if (query.scopeId && m.scopeId !== query.scopeId)
                return false;
            if (query.pinnedOnly && !m.pinned)
                return false;
            return true;
        });
    }
    /** MEM-005 — candidate extraction passes through sensitive-content filtering first. */
    extractCandidate(text) {
        const blocked = this.filter.scan(text);
        if (blocked)
            return err('Candidate contains sensitive content and was blocked from memory.');
        const canonical = this.assertNotCanonical(text);
        if (!canonical.ok)
            return canonical;
        return ok(text.trim());
    }
    store(item) {
        if (item.sensitive) {
            const blocked = this.filter.scan(item.value);
            if (blocked)
                return err('Sensitive memory requires explicit user action and a defined product need (MEM-005).');
        }
        const canonical = this.assertNotCanonical(item.value);
        if (!canonical.ok)
            return canonical;
        const now = Date.now();
        const full = { ...item, id: `mem_${Math.random().toString(36).slice(2, 11)}`, createdAt: now, updatedAt: now };
        this.items.set(full.id, full);
        return ok(full);
    }
    correct(id, value) {
        const m = this.items.get(id);
        if (!m)
            return err('Memory item not found');
        const res = this.extractCandidate(value);
        if (!res.ok)
            return res;
        m.value = value;
        m.updatedAt = Date.now();
        return ok(m);
    }
    pin(id, pinned) {
        const m = this.items.get(id);
        if (!m)
            return err('Memory item not found');
        m.pinned = pinned;
        return ok(m);
    }
    changeScope(id, scope, scopeId) {
        const m = this.items.get(id);
        if (!m)
            return err('Memory item not found');
        m.scope = scope;
        m.scopeId = scopeId;
        return ok(m);
    }
    disableCategory(userId, category) {
        for (const m of this.items.values()) {
            if (m.category === category && m.scopeId === userId)
                m.value = '[disabled]';
        }
    }
    delete(id) {
        if (!this.items.delete(id))
            return err('Memory item not found');
        return ok(undefined);
    }
    exportAll(userId) {
        return this.retrieve({ scopeId: userId });
    }
    disable(userId) {
        this.disabledUsers.add(userId);
    }
    isDisabled(userId) {
        return this.disabledUsers.has(userId);
    }
    /** MEM-001 — consolidation/deduplication pass. */
    consolidate() {
        const byKey = new Map();
        let merged = 0;
        for (const m of this.items.values()) {
            const key = `${m.category}:${m.scope}:${m.scopeId}:${m.value.toLowerCase()}`;
            const existing = byKey.get(key);
            if (existing) {
                if (m.provenance === 'user-confirmed')
                    existing.provenance = 'user-confirmed';
                existing.confidence = Math.max(existing.confidence, m.confidence);
                this.items.delete(m.id);
                merged++;
            }
            else {
                byKey.set(key, m);
            }
        }
        return merged;
    }
}
export const mnemosyne = new Mnemosyne();
//# sourceMappingURL=mnemosyne.js.map