export class KnowledgeShare {
    entries = [];
    create(entry) {
        const full = { ...entry, id: `ks_${Math.random().toString(36).slice(2, 11)}` };
        this.entries.push(full);
        return full;
    }
    /** Contextual recommendation: entries whose tags match the active context. */
    recommend(contextTags, viewerId) {
        return this.entries.filter((e) => e.permissions.includes(viewerId) || e.permissions.includes('*')).filter((e) => e.tags.some((t) => contextTags.includes(t)));
    }
    insert(id) {
        return this.entries.find((e) => e.id === id);
    }
}
//# sourceMappingURL=knowledge.js.map