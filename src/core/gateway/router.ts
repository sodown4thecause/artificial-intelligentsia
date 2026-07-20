// AI SDK imports are intentionally deferred until the MVP executes real model calls.
// import { generateText } from 'ai';
// import { gateway } from '@ai-sdk/gateway';

import { FallbackChain, shouldFallback } from './fallback.js';
import {
  getPolicyForTaskClass,
  type ModelAlias,
  type ModelPolicy,
  type TaskClass,
  type WorkspacePolicyOverride,
} from './policy.js';

export type { ModelAlias, ModelPolicy, TaskClass, WorkspacePolicyOverride } from './policy.js';

export interface RoutingOptions {
  readonly requestedAlias?: ModelAlias;
  readonly estimatedCost: number;
  readonly workspacePolicy?: WorkspacePolicyOverride;
}

export interface PolicyAllowed<TRequest> {
  readonly kind: 'allowed';
  readonly taskClass: TaskClass;
  readonly alias: ModelAlias;
  readonly policy: ModelPolicy;
  readonly estimatedCost: number;
  readonly request: TRequest;
}

export interface PolicyRejected {
  readonly kind: 'rejected';
  readonly taskClass: TaskClass;
  readonly alias: ModelAlias;
  readonly policy: ModelPolicy;
  readonly reason: 'conflicting_requested_alias' | 'budget_exceeded' | 'invalid_cost_estimate';
  readonly estimatedCost: number;
}

export type PolicyDecision<TRequest> = PolicyAllowed<TRequest> | PolicyRejected;

/** Resolves a D9 task class before dispatching a provider request. */
export function routeModel<TRequest>(
  taskClass: TaskClass,
  request: TRequest,
  options: RoutingOptions,
): PolicyDecision<TRequest> {
  const policy = getPolicyForTaskClass(taskClass, options.workspacePolicy);
  const { alias } = policy;

  if (options.requestedAlias !== undefined && options.requestedAlias !== alias) {
    return {
      kind: 'rejected', taskClass, alias, policy, estimatedCost: options.estimatedCost,
      reason: 'conflicting_requested_alias',
    };
  }

  if (!Number.isFinite(options.estimatedCost) || options.estimatedCost < 0) {
    return {
      kind: 'rejected', taskClass, alias, policy, estimatedCost: options.estimatedCost,
      reason: 'invalid_cost_estimate',
    };
  }

  if (options.estimatedCost > policy.spendLimit) {
    return { kind: 'rejected', taskClass, alias, policy, estimatedCost: options.estimatedCost, reason: 'budget_exceeded' };
  }

  return { kind: 'allowed', taskClass, alias, policy, estimatedCost: options.estimatedCost, request };
}

export interface GatewayConfig {
  gatewayUrl: string;
  provider: string;
  apiKey: string;
}

export interface GatewayResponse<TRequest = unknown> {
  readonly model: ModelAlias;
  readonly request: TRequest;
  readonly provider: string;
  readonly status: 'mock';
}

export interface GatewayClient {
  readonly config: GatewayConfig;
  generate<TRequest>(request: TRequest, model: ModelAlias): Promise<GatewayResponse<TRequest>>;
}

/** Gateway client seam for the MVP. */
export function createGatewayClient(config: GatewayConfig): GatewayClient {
  return {
    config,
    async generate<TRequest>(request: TRequest, model: ModelAlias): Promise<GatewayResponse<TRequest>> {
      return { model, request, provider: config.provider, status: 'mock' };
    },
  };
}

export type GatewayExecutionResult<TRequest> =
  | PolicyRejected
  | { readonly kind: 'completed'; readonly response: GatewayResponse<TRequest>; readonly attempts: number };

/**
 * Reuses the exact request for each attempt, preserving its output schema. Each
 * attempt uses the same alias; the gateway owns any provider-level fallback.
 */
export async function executeWithFallback<TRequest>(
  taskClass: TaskClass,
  request: TRequest,
  options: RoutingOptions,
  client: GatewayClient = createGatewayClient({
    gatewayUrl: process.env.VERCEL_AI_GATEWAY_URL ?? '',
    provider: 'vercel-ai-gateway',
    apiKey: process.env.AI_GATEWAY_API_KEY ?? '',
  }),
): Promise<GatewayExecutionResult<TRequest>> {
  const decision = routeModel(taskClass, request, options);
  if (decision.kind === 'rejected') return decision;

  const chain = new FallbackChain(decision.alias);
  let lastError: unknown;

  for (const [index, alias] of chain.models.entries()) {
    try {
      return { kind: 'completed', response: await client.generate(request, alias), attempts: index + 1 };
    } catch (error) {
      lastError = error;
      if (!shouldFallback(error)) throw error;
    }
  }

  throw lastError;
}
