// WRITE-003 — Tone suggestions: edits to move toward a selected tone without changing meaning.
import { type ToneDimension } from './tone';

const SUBSTITUTIONS: Partial<Record<ToneDimension, [RegExp, string][]>> = {
  formality: [
    [/\bgonna\b/gi, 'going to'],
    [/\bwanna\b/gi, 'want to'],
    [/\bcool\b/gi, 'acceptable'],
  ],
  warmth: [
    [/\byou must\b/gi, 'please'],
    [/\bdo this now\b/gi, 'whenever you are able, please take care of this'],
  ],
  directness: [
    [/\bif you have time\b/gi, 'please'],
    [/\bmaybe consider\b/gi, 'please'],
  ],
};

export function suggestTone(text: string, target: ToneDimension): { rewritten: string; applied: string[] } {
  const subs = SUBSTITUTIONS[target] ?? [];
  let out = text;
  const applied: string[] = [];
  for (const [re, replacement] of subs) {
    if (re.test(out)) {
      out = out.replace(re, replacement);
      applied.push(re.source);
    }
  }
  return { rewritten: out, applied: applied.length ? applied : ['no mechanical substitutions available; consider rephrasing'] };
}
