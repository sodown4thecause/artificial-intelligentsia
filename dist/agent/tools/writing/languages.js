// WRITE-008 — Translation. Language availability is CONFIG-DRIVEN, not hardcoded (PRD §10.2).
export const TRANSLATE_LANGUAGES = [
    'ar', 'zh', 'cs', 'nl', 'en', 'fr', 'de', 'el', 'he', 'hi', 'hu', 'id', 'it', 'ja', 'ko', 'pl', 'pt', 'ro', 'ru', 'es', 'sv', 'th', 'tr', 'uk', 'vi',
]; // 25 entries (>=17 required for translate, >=24 for rewrite)
export const REWRITE_LANGUAGES = TRANSLATE_LANGUAGES;
export function isLanguageSupported(lang, cfg, kind) {
    const list = kind === 'translate' ? cfg.enabledTranslate : cfg.enabledRewrite;
    return list.includes(lang);
}
// Foundation: deterministic passthrough; real impl routes to model per §12.3 policy.
export function translate(text, target, cfg) {
    if (!isLanguageSupported(target, cfg, 'translate'))
        return { ok: false, output: `Language ${target} not enabled for translation.` };
    return { ok: true, output: `[${target}] ${text}` };
}
//# sourceMappingURL=languages.js.map