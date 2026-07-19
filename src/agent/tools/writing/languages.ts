// WRITE-008 — Translation. Language availability is CONFIG-DRIVEN, not hardcoded (PRD §10.2).
export const TRANSLATE_LANGUAGES = [
  'ar', 'zh', 'cs', 'nl', 'en', 'fr', 'de', 'el', 'he', 'hi', 'hu', 'id', 'it', 'ja', 'ko', 'pl', 'pt', 'ro', 'ru', 'es', 'sv', 'th', 'tr', 'uk', 'vi',
] as const; // 25 entries (>=17 required for translate, >=24 for rewrite)

export const REWRITE_LANGUAGES = TRANSLATE_LANGUAGES;

export interface LanguageConfig {
  enabledTranslate: string[];
  enabledRewrite: string[];
}

export function isLanguageSupported(lang: string, cfg: LanguageConfig, kind: 'translate' | 'rewrite'): boolean {
  const list = kind === 'translate' ? cfg.enabledTranslate : cfg.enabledRewrite;
  return list.includes(lang);
}

// Foundation: deterministic passthrough; real impl routes to model per §12.3 policy.
export function translate(text: string, target: string, cfg: LanguageConfig): { ok: boolean; output: string } {
  if (!isLanguageSupported(target, cfg, 'translate')) return { ok: false, output: `Language ${target} not enabled for translation.` };
  return { ok: true, output: `[${target}] ${text}` };
}
