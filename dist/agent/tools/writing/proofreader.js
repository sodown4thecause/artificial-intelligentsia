// WRITE-009 — Proofreader agent: full-document review grouped by category, batch-accept by category.
import { checkCorrectness } from './correctness';
import { checkInclusivity } from './inclusivity';
import { detectTone } from './tone';
export function proofread(text, inclConfig) {
    const issues = [];
    for (const s of checkCorrectness(text))
        issues.push({ category: 'correctness', message: s.message, start: s.start, end: s.end, severity: s.severity });
    for (const s of checkInclusivity(text, inclConfig))
        issues.push({ category: 'inclusivity', message: s.message, start: s.start, end: s.end, severity: 'warning' });
    const tone = detectTone(text);
    if (tone.estimate.ambiguity > 0.6)
        issues.push({ category: 'clarity', message: 'High ambiguity detected; consider specifics.', start: 0, end: text.length, severity: 'info' });
    const byCategory = {};
    for (const i of issues)
        byCategory[i.category] = (byCategory[i.category] ?? 0) + 1;
    const significant = issues.filter((i) => i.severity === 'error' || i.severity === 'warning').length;
    return { issues, byCategory, summary: `${issues.length} issues (${significant} significant) across ${Object.keys(byCategory).length} categories.` };
}
export function batchAccept(issues, category) {
    return issues.filter((i) => i.category !== category);
}
//# sourceMappingURL=proofreader.js.map