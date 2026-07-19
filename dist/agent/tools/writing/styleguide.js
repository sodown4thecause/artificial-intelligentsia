export function checkStyle(text, guide) {
    const prohibited = [];
    const suggestions = [];
    for (const term of guide.prohibitedTerms) {
        if (new RegExp(`\\b${term}\\b`, 'gi').test(text))
            prohibited.push(term);
    }
    for (const term of guide.preferredTerms) {
        suggestions.push(`Prefer "${term}" where applicable.`);
    }
    return { prohibited, suggestions };
}
//# sourceMappingURL=styleguide.js.map