// AI SDK imports are intentionally deferred until the MVP executes real model calls.
// import { generateText } from 'ai';
// import { gateway } from '@ai-sdk/gateway';

import { FallbackChain, shouldFallback } from './fallback';
import { getPolicyForTaskClass, type ModelPolicy, type TaskClass } from './policy';
import type { ModelPolicy as TierPolicy, ModelTier } from '../types';

export type { ModelPolicy, TaskClass } from './policy';

// Kept while existing agents migrate from the original tier-based router.
export const DEFAULT_MODEL_POLICY: TierPolicy = { routine: 'cheap', complex: 'strong' };

const tierModels: Record<ModelTier, string> = {
  cheap: 'router-cheap',
  standard: 'router-standard',
  strong: 'router-strong',
};

type LegacyTaskClass = 'classify' | 'research' | 'high-impact-draft';

export class AIGateway {
  constructor(private readonly policy: TierPolicy = DEFAULT_MODEL_POLICY) {}

  route(task: TaskClass | LegacyTaskClass): { model: string; tier: ModelTier } {
    const tier: ModelTier = ['classification', 'classify', 'rewrite', 'extract', 'summarize'].includes(task)
      ? this.policy.routine
      : this.policy.complex;
    return { model: tierModels[tier], tier };
  }

  withPolicy(policy: TierPolicy): AIGateway {
    return new AIGateway(policy);
  }
}

export const aiGateway = new AIGateway();

export interface GatewayConfig {
  gatewayUrl: string;
  provider: string;
  apiKey: string;
}

export interface GatewayClient {
  readonly config: GatewayConfig;
  generate(request: unknown, model: string): Promise<GatewayResponse>;
}

export interface GatewayResponse {
  model: string;
  request: unknown;
  provider: string;
  status: 'mock';
}

export interface RoutedModel {
  model: string;
  policy: ModelPolicy;
  request: unknown;
}

/** Resolves a model without making a provider request. */
export function routeModel(taskClass: TaskClass, request: unknown): RoutedModel {
  const policy = getPolicyForTaskClass(taskClass);
  return { model: policy.defaultModel, policy, request };
}

/**
 * Gateway client seam for the MVP. It is deliberately network-free until request
 * authentication and telemetry are introduced; callers receive a typed response.
 */
export function createGatewayClient(config: GatewayConfig): GatewayClient {
  return {
    config,
    async generate(request: unknown, model: string): Promise<GatewayResponse> {
      return { model, request, provider: config.provider, status: 'mock' };
    },
  };
}

/** Routes a request and retries retryable provider errors using policy fallbacks. */
export async function executeWithFallback(taskClass: TaskClass, request: unknown): Promise<GatewayResponse> {
  const routed = routeModel(taskClass, request);
  const client = createGatewayClient({
    gatewayUrl: process.env.VERCEL_AI_GATEWAY_URL ?? '',
    provider: 'vercel-ai-gateway',
    apiKey: process.env.AI_GATEWAY_API_KEY ?? '',
  });
  const chain = new FallbackChain([routed.model, ...routed.policy.fallbackModels]);
  let model: string | null = routed.model;

  while (model !== null) {
    try {
      return await client.generate(request, model);
    } catch (error) {
      if (!shouldFallback(error)) throw error;
      model = chain.next(model);
    }
  }

  throw new Error(`All fallback models failed for ${taskClass}`);
}
