export const REDACTED_SECRET = "[REDACTED]";

const secretPatterns: readonly RegExp[] = [
  /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/g,
  /(\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|passwd|pwd|secret|authorization)\b\s*(?:=|:)\s*)(?:(?:Bearer\s+)?(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s,;)\]]+))/gi,
  /(\bBearer\s+)[A-Za-z0-9._~+/=-]+/gi,
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk_(?:live|test)_[A-Za-z0-9]{16,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16})\b/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+[a-z0-9]+)?|redis(?:s)?|amqp(?:s)?):\/\/[^\s'"`<>()]+/gi,
  // Test-safe fake secret pattern so red-team fixtures do not need real-looking credentials.
  /\bFAKE_(?:API_KEY|BEARER_TOKEN)(?:_VALUE)?_[A-Za-z0-9]{20,}\b/g,
];

/** Replaces credential values with a stable placeholder suitable for logs and UI. */
export function redactSecrets(value: string): string {
  const [privateKey, labelledSecret, bearerToken, providerToken, jwt, connectionString, fakeTestToken] = secretPatterns;
  return value
    .replace(privateKey, REDACTED_SECRET)
    .replace(labelledSecret, `$1${REDACTED_SECRET}`)
    .replace(bearerToken, `$1${REDACTED_SECRET}`)
    .replace(providerToken, REDACTED_SECRET)
    .replace(jwt, REDACTED_SECRET)
    .replace(connectionString, REDACTED_SECRET)
    .replace(fakeTestToken, REDACTED_SECRET);
}

/** Returns whether redaction would change the supplied value. */
export function containsSecret(value: string): boolean {
  return redactSecrets(value) !== value;
}
