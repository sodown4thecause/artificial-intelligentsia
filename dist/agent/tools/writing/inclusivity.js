const CATEGORIES = {
    gendered: { pattern: /\b(he|she|chairman|mankind|manpower|policeman)\b/gi, alt: 'they / chairperson / people / police officer' },
    ability: { pattern: /\b(crazy|lame|blind to|deaf to|sanity check)\b/gi, alt: 'consider "unexpected" / "overlooked" instead' },
    age: { pattern: /\b(grandfathered|young gun|old school)\b/gi, alt: 'consider neutral phrasing' },
};
export function checkInclusivity(text, config = { enabledCategories: Object.keys(CATEGORIES) }) {
    const out = [];
    for (const [cat, { pattern, alt }] of Object.entries(CATEGORIES)) {
        if (!config.enabledCategories.includes(cat))
            continue;
        let m;
        while ((m = pattern.exec(text))) {
            out.push({ message: `Potentially exclusionary language (${cat}): "${m[0]}"`, suggestion: alt, start: m.index, end: m.index + m[0].length });
        }
    }
    return out;
}
//# sourceMappingURL=inclusivity.js.map