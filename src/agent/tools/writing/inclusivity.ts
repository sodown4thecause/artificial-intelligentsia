// WRITE-005 — Inclusivity suggestions with admin-configurable categories.
export interface InclusivityConfig {
  enabledCategories: string[];
}

const CATEGORIES: Record<string, { pattern: RegExp; alt: string }> = {
  gendered: { pattern: /\b(he|she|chairman|mankind|manpower|policeman)\b/gi, alt: 'they / chairperson / people / police officer' },
  ability: { pattern: /\b(crazy|lame|blind to|deaf to|sanity check)\b/gi, alt: 'consider "unexpected" / "overlooked" instead' },
  age: { pattern: /\b(grandfathered|young gun|old school)\b/gi, alt: 'consider neutral phrasing' },
};

export function checkInclusivity(text: string, config: InclusivityConfig = { enabledCategories: Object.keys(CATEGORIES) }): { message: string; suggestion: string; start: number; end: number }[] {
  const out: { message: string; suggestion: string; start: number; end: number }[] = [];
  for (const [cat, { pattern, alt }] of Object.entries(CATEGORIES)) {
    if (!config.enabledCategories.includes(cat)) continue;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text))) {
      out.push({ message: `Potentially exclusionary language (${cat}): "${m[0]}"`, suggestion: alt, start: m.index, end: m.index + m[0].length });
    }
  }
  return out;
}
