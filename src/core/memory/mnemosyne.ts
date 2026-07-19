// PRD §12.5, MEM-001..005 — Mnemosyne memory service.
import type { MemoryCategory, MemoryItem, Result } from '../types';
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

export interface MemoryQuery {
  category?: MemoryCategory;
  scope?: MemoryItem['scope'];
  scopeId?: string;
  pinnedOnly?: boolean;
}

// MEM-002: scoped memory categories (personal-preference, writing-voice, communication-preference,
// project-context, workspace-terminology, reusable-procedure, relationship-context).
// MEM-003: user controls — review, correct, pin, change scope, disable category, delete, export, disable entirely.
export class Mnemosyne {
  private items: Map<string, MemoryItem> = new Map();
  private disabledUsers = new Set<string>();
  private filter = new SensitiveContentFilter();

  /** MEM-004 — memory must not replace canonical sources. */
  private assertNotCanonical(value: string): Result<void> {
    const v = value.toLowerCase();
    for (const c of PROHIBITED_CANONICAL) {
      if (v.includes(c) && v.length < 80) return err(`Refusing to store canonical source reference: ${c}`);
    }
    return ok(undefined);
  }

  retrieve(query: MemoryQuery = {}): MemoryItem[] {
    return Array.from(this.items.values()).filter((m: MemoryItem) => {
      if (query.category && m.category !== query.category) return false;
      if (query.scope && m.scope !== query.scope) return false;
      if (query.scopeId && m.scopeId !== query.scopeId) return false;
      if (query.pinnedOnly && !m.pinned) return false;
      return true;
    });
  }

  /** MEM-005 — candidate extraction passes through sensitive-content filtering first. */
  extractCandidate(text: string): Result<string> {
    const blocked = this.filter.scan(text);
    if (blocked) return err('Candidate contains sensitive content and was blocked from memory.');
    const canonical = this.assertNotCanonical(text);
    if (!canonical.ok) return canonical;
    return ok(text.trim());
  }

  store(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>): Result<MemoryItem> {
    if (item.sensitive) {
      const blocked = this.filter.scan(item.value);
      if (blocked) return err('Sensitive memory requires explicit user action and a defined product need (MEM-005).');
    }
    const canonical = this.assertNotCanonical(item.value);
    if (!canonical.ok) return canonical;
    const now = Date.now();
    const full: MemoryItem = { ...item, id: `mem_${Math.random().toString(36).slice(2, 11)}`, createdAt: now, updatedAt: now };
    this.items.set(full.id, full);
    return ok(full);
  }

  correct(id: string, value: string): Result<MemoryItem> {
    const m = this.items.get(id);
    if (!m) return err('Memory item not found');
    const res = this.extractCandidate(value);
    if (!res.ok) return res;
    m.value = value;
    m.updatedAt = Date.now();
    return ok(m);
  }

  pin(id: string, pinned: boolean): Result<MemoryItem> {
    const m = this.items.get(id);
    if (!m) return err('Memory item not found');
    m.pinned = pinned;
    return ok(m);
  }

  changeScope(id: string, scope: MemoryItem['scope'], scopeId?: string): Result<MemoryItem> {
    const m = this.items.get(id);
    if (!m) return err('Memory item not found');
    m.scope = scope;
    m.scopeId = scopeId;
    return ok(m);
  }

  disableCategory(userId: string, category: MemoryCategory): void {
    for (const m of this.items.values()) {
      if (m.category === category && m.scopeId === userId) m.value = '[disabled]';
    }
  }

  delete(id: string): Result<void> {
    if (!this.items.delete(id)) return err('Memory item not found');
    return ok(undefined);
  }

  exportAll(userId: string): MemoryItem[] {
    return this.retrieve({ scopeId: userId });
  }

  disable(userId: string): void {
    this.disabledUsers.add(userId);
  }

  isDisabled(userId: string): boolean {
    return this.disabledUsers.has(userId);
  }

  /** MEM-001 — consolidation/deduplication pass. */
  consolidate(): number {
    const byKey = new Map<string, MemoryItem>();
    let merged = 0;
    for (const m of this.items.values()) {
      const key = `${m.category}:${m.scope}:${m.scopeId}:${m.value.toLowerCase()}`;
      const existing = byKey.get(key);
      if (existing) {
        if (m.provenance === 'user-confirmed') existing.provenance = 'user-confirmed';
        existing.confidence = Math.max(existing.confidence, m.confidence);
        this.items.delete(m.id);
        merged++;
      } else {
        byKey.set(key, m);
      }
    }
    return merged;
  }
}

export const mnemosyne = new Mnemosyne();
