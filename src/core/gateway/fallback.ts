import type { ModelAlias } from './policy.js';

export interface FallbackError {
  readonly status?: number;
  readonly statusCode?: number;
  readonly code?: string;
  readonly responseStarted?: boolean;
  readonly toolCallEmitted?: boolean;
}

/** Only failures before output or tool activity may use a gateway fallback. */
export function shouldFallback(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const candidate = error as FallbackError;
  if (candidate.responseStarted || candidate.toolCallEmitted) return false;

  const status = candidate.status ?? candidate.statusCode;
  if (status === 408 || (status !== undefined && status >= 500)) return true;

  const code = candidate.code?.toUpperCase() ?? '';
  return ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(code);
}

/** Returns the next attempt while deliberately retaining the gateway alias. */
export function nextModel(failedModel: ModelAlias, chain: readonly ModelAlias[]): ModelAlias | null {
  const failedIndex = chain.indexOf(failedModel);
  return failedIndex === -1 ? null : chain[failedIndex + 1] ?? null;
}

/**
 * Gateway aliases conceal provider selection. Repeated entries mean the gateway
 * may retry or switch providers without an application-level tier change.
 */
export class FallbackChain {
  readonly models: readonly ModelAlias[];

  constructor(alias: ModelAlias, attempts = 2) {
    this.models = Array.from({ length: Math.max(1, attempts) }, () => alias);
  }
}
