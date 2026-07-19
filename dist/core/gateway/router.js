// AI SDK imports are intentionally deferred until the MVP executes real model calls.
// import { generateText } from 'ai';
// import { gateway } from '@ai-sdk/gateway';
import { FallbackChain, shouldFallback } from './fallback';
import { getPolicyForTaskClass } from './policy';
// Kept while existing agents migrate from the original tier-based router.
export const DEFAULT_MODEL_POLICY = { routine: 'cheap', complex: 'strong' };
const tierModels = {
    cheap: 'router-cheap',
    standard: 'router-standard',
    strong: 'router-strong',
};
export class AIGateway {
    policy;
    constructor(policy = DEFAULT_MODEL_POLICY) {
        this.policy = policy;
    }
    route(task) {
        const tier = ['classification', 'classify', 'rewrite', 'extract', 'summarize'].includes(task)
            ? this.policy.routine
            : this.policy.complex;
        return { model: tierModels[tier], tier };
    }
    withPolicy(policy) {
        return new AIGateway(policy);
    }
}
export const aiGateway = new AIGateway();
/** Resolves a model without making a provider request. */
export function routeModel(taskClass, request) {
    const policy = getPolicyForTaskClass(taskClass);
    return { model: policy.defaultModel, policy, request };
}
/**
 * Gateway client seam for the MVP. It is deliberately network-free until request
 * authentication and telemetry are introduced; callers receive a typed response.
 */
export function createGatewayClient(config) {
    return {
        config,
        async generate(request, model) {
            return { model, request, provider: config.provider, status: 'mock' };
        },
    };
}
/** Routes a request and retries retryable provider errors using policy fallbacks. */
export async function executeWithFallback(taskClass, request) {
    const routed = routeModel(taskClass, request);
    const client = createGatewayClient({
        gatewayUrl: process.env.VERCEL_AI_GATEWAY_URL ?? '',
        provider: 'vercel-ai-gateway',
        apiKey: process.env.AI_GATEWAY_API_KEY ?? '',
    });
    const chain = new FallbackChain([routed.model, ...routed.policy.fallbackModels]);
    let model = routed.model;
    while (model !== null) {
        try {
            return await client.generate(request, model);
        }
        catch (error) {
            if (!shouldFallback(error))
                throw error;
            model = chain.next(model);
        }
    }
    throw new Error(`All fallback models failed for ${taskClass}`);
}
//# sourceMappingURL=router.js.map