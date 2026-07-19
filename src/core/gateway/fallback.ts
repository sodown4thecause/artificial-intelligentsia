/** A retryable provider error can be safely retried with a fallback model. */
export function shouldFallback(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const candidate = error as { status?: unknown; statusCode?: unknown; code?: unknown; message?: unknown };
  const status = typeof candidate.status === 'number'
    ? candidate.status
    : typeof candidate.statusCode === 'number'
      ? candidate.statusCode
      : undefined;
  if (status === 408 || status === 409 || status === 425 || status === 429 || (status !== undefined && status >= 500)) {
    return true;
  }

  const code = typeof candidate.code === 'string' ? candidate.code.toUpperCase() : '';
  return ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(code);
}

/** Returns the next distinct model in a fallback chain, if one exists. */
export function nextModel(failedModel: string, chain: string[]): string | null {
  const failedIndex = chain.indexOf(failedModel);
  if (failedIndex === -1) return null;
  for (let index = failedIndex + 1; index < chain.length; index += 1) {
    if (chain[index] !== failedModel) return chain[index];
  }
  return null;
}

export class FallbackChain {
  constructor(readonly models: string[]) {}

  next(failedModel: string): string | null {
    return nextModel(failedModel, this.models);
  }
}
