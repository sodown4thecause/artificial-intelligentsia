// WRITE-014 — Knowledge Share & snippets (permissioned, manually inserted or contextually recommended).
import type { MemoryCategory } from '../../../core/types';

export interface KnowledgeEntry {
  id: string;
  kind: 'snippet' | 'knowledge';
  content: string;
  permissions: string[]; // user/team/workspace ids allowed
  tags: string[];
  category?: MemoryCategory;
}

export class KnowledgeShare {
  private entries: KnowledgeEntry[] = [];

  create(entry: Omit<KnowledgeEntry, 'id'>): KnowledgeEntry {
    const full = { ...entry, id: `ks_${Math.random().toString(36).slice(2, 11)}` };
    this.entries.push(full);
    return full;
  }

  /** Contextual recommendation: entries whose tags match the active context. */
  recommend(contextTags: string[], viewerId: string): KnowledgeEntry[] {
    return this.entries.filter(
      (e) => e.permissions.includes(viewerId) || e.permissions.includes('*'),
    ).filter((e) => e.tags.some((t) => contextTags.includes(t)));
  }

  insert(id: string): KnowledgeEntry | undefined {
    return this.entries.find((e) => e.id === id);
  }
}
