// PRD §13.2 — Secret handling. Secrets must never enter prompts, logs, telemetry, memory, or errors.
const SECRET_PATTERNS = [
    /sk-[a-zA-Z0-9]{20,}/g, // openai-style
    /AIza[0-9A-Za-z_-]{35}/g, // google api
    /ya29\.[0-9A-Za-z_-]+/g, // google oauth
    /xox[baprs]-[0-9A-Za-z-]+/g, // slack
    /ghp_[0-9A-Za-z]{36}/g, // github
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // jwt
    /AKIA[0-9A-Z]{16}/g, // aws
    /password\s*[:=]\s*["']?[^"'\s]+/gi,
    /token\s*[:=]\s*["']?[^"'\s]+/gi,
    /secret\s*[:=]\s*["']?[^"'\s]+/gi,
    /api[_-]?key\s*[:=]\s*["']?[^"'\s]+/gi,
    /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
];
export function isSecret(value) {
    return SECRET_PATTERNS.some((re) => re.test(value));
}
export function redactSecrets(text) {
    let out = text;
    for (const re of SECRET_PATTERNS) {
        out = out.replace(re, (m) => `[REDACTED:${m.slice(0, 4)}…${m.slice(-2)}]`);
    }
    return out;
}
/** Deep-scrub an object so secrets never persist in memory/logs/telemetry. */
export function scrubForPersistence(obj) {
    const walk = (val) => {
        if (typeof val === 'string')
            return redactSecrets(val);
        if (Array.isArray(val))
            return val.map(walk);
        if (val && typeof val === 'object') {
            const out = {};
            for (const [k, v] of Object.entries(val)) {
                out[k] = /pass|token|secret|key|credential|auth/i.test(k) ? (typeof v === 'string' ? '[REDACTED]' : v) : walk(v);
            }
            return out;
        }
        return val;
    };
    return walk(obj);
}
//# sourceMappingURL=secrets.js.map