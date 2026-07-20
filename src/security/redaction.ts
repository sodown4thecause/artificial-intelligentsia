const secretPatterns = [
  /\b(?:api[_-]?key|token|password|secret)\s*[=:]\s*[^\s,;]+/gi,
  /\bsk-[A-Za-z0-9_-]+\b/g,
  /\bghp_[A-Za-z0-9]+\b/g,
];

/** Removes common credential formats before values are shown in the UI. */
export function redactSecrets(value: string): string {
  return secretPatterns.reduce((redacted, pattern) => redacted.replace(pattern, "[REDACTED]"), value);
}
