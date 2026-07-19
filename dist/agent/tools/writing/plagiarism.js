export function checkPlagiarism(text, sources) {
    const matches = [];
    const tokens = text.toLowerCase().split(/\s+/).filter((t) => t.length > 4);
    for (const s of sources) {
        const srcTokens = new Set(s.content.toLowerCase().split(/\s+/));
        const overlap = tokens.filter((t) => srcTokens.has(t)).length;
        const sim = tokens.length ? overlap / tokens.length : 0;
        if (sim > 0.1) {
            const quoted = /["“'].*["”']/.test(text);
            const cited = /\([A-Z][a-z]+,?\s*\d{4}\)/.test(text);
            const kind = quoted ? 'quotation' : cited ? 'citation' : sim > 0.5 ? 'likely-unattributed' : 'common-phrasing';
            matches.push({ passage: text.slice(0, 60), source: s.id, kind, similarity: Math.round(sim * 100) / 100 });
        }
    }
    return matches;
}
export function verdict(matches) {
    const unattributed = matches.filter((m) => m.kind === 'likely-unattributed');
    if (unattributed.length === 0)
        return 'No unattributed overlap detected. Similarity alone does not indicate plagiarism.';
    return `Potential unattributed overlap with ${unattributed.length} source(s). Review required; do NOT label the user as having plagiarized based on similarity score.`;
}
//# sourceMappingURL=plagiarism.js.map