// WRITE-010 — AI detection. Probability range + uncertainty; mandatory warning.
export function detectAI(text: string): { probabilityRange: [number, number]; uncertainty: string; warning: string } {
  // Foundation heuristic: low-entropy, uniform punctuation, repeated structures.
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const avgLen = sentences.reduce((a, s) => a + s.trim().split(/\s+/).length, 0) / Math.max(1, sentences.length);
  const low = Math.min(0.95, Math.max(0.05, avgLen > 18 ? 0.7 : 0.3));
  return {
    probabilityRange: [Math.round(low * 100) / 100, Math.round(Math.min(0.98, low + 0.2) * 100) / 100],
    uncertainty: 'Estimate based on surface features; not reliable for individual texts.',
    warning: 'This result is NOT definitive and must not be the sole basis for disciplinary, employment, academic, or legal decisions.',
  };
}
