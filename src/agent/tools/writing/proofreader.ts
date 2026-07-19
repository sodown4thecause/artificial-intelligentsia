// WRITE-009 — Proofreader agent: full-document review grouped by category, batch-accept by category.
import { checkCorrectness } from './correctness';
import { checkInclusivity, type InclusivityConfig } from './inclusivity';
import { detectTone } from './tone';

export interface ProofIssue {
  category: string;
  message: string;
  start: number;
  end: number;
  severity: string;
}

export function proofread(text: string, inclConfig?: InclusivityConfig): { issues: ProofIssue[]; byCategory: Record<string, number>; summary: string } {
  const issues: ProofIssue[] = [];
  for (const s of checkCorrectness(text)) issues.push({ category: 'correctness', message: s.message, start: s.start, end: s.end, severity: s.severity });
  for (const s of checkInclusivity(text, inclConfig)) issues.push({ category: 'inclusivity', message: s.message, start: s.start, end: s.end, severity: 'warning' });
  const tone = detectTone(text);
  if (tone.estimate.ambiguity > 0.6) issues.push({ category: 'clarity', message: 'High ambiguity detected; consider specifics.', start: 0, end: text.length, severity: 'info' });
  const byCategory: Record<string, number> = {};
  for (const i of issues) byCategory[i.category] = (byCategory[i.category] ?? 0) + 1;
  const significant = issues.filter((i) => i.severity === 'error' || i.severity === 'warning').length;
  return { issues, byCategory, summary: `${issues.length} issues (${significant} significant) across ${Object.keys(byCategory).length} categories.` };
}

export function batchAccept(issues: ProofIssue[], category: string): ProofIssue[] {
  return issues.filter((i) => i.category !== category);
}
