const MISSING = 'n/a';
function names(c) {
    if (!c.authors || c.authors.length === 0)
        return MISSING;
    if (c.authors.length === 1)
        return c.authors[0];
    if (c.authors.length === 2)
        return `${c.authors[0]} & ${c.authors[1]}`;
    return `${c.authors[0]} et al.`;
}
export function formatCitation(c, style) {
    const title = c.title ?? MISSING;
    switch (style) {
        case 'APA':
            return `(${names(c)}, ${c.year ?? MISSING}). ${title}. ${c.publisher ?? MISSING}.`;
        case 'MLA':
            return `${names(c)}. "${title}." ${c.publisher ?? MISSING}, ${c.year ?? MISSING}.`;
        case 'Chicago':
            return `${names(c)}. ${title}. ${c.publisher ?? MISSING}, ${c.year ?? MISSING}.`;
        case 'generic-linked':
            return c.url ? `[${title}](${c.url})` : `[${title}] (source ${MISSING})`;
    }
}
//# sourceMappingURL=citation.js.map