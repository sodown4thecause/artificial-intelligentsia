import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { FallbackChain } from '../../src/core/gateway/fallback.js';
import {
  executeWithFallback,
  routeModel,
  type GatewayClient,
  type GatewayResponse,
  type ModelAlias,
} from '../../src/core/gateway/router.js';

describe('D9 gateway routing', () => {
  for (const [taskClass, alias] of [
    ['classification', 'creature-fast'],
    ['rewrite_extraction_summarization', 'creature-fast'],
    ['planning_research_synthesis', 'creature-strong'],
    ['high_impact_drafting', 'creature-premium'],
  ] as const) {
    test(`routes ${taskClass} to ${alias}`, () => {
      const decision = routeModel(taskClass, { outputSchema: 'test' }, { estimatedCost: 0 });

      assert.equal(decision.kind, 'allowed');
      assert.equal(decision.alias, alias);
    });
  }

  test('rejects a requested alias that conflicts with the task class', () => {
    const decision = routeModel('classification', {}, {
      requestedAlias: 'creature-strong',
      estimatedCost: 0,
    });

    assert.equal(decision.kind, 'rejected');
    assert.equal(decision.reason, 'conflicting_requested_alias');
  });

  test('keeps fallback attempts in the effective alias and preserves the request object', async () => {
    const request = { outputSchema: { type: 'object' } };
    const attemptedAliases: ModelAlias[] = [];
    const client: GatewayClient = {
      config: { gatewayUrl: '', provider: 'test', apiKey: '' },
      async generate<TRequest>(currentRequest: TRequest, alias: ModelAlias): Promise<GatewayResponse<TRequest>> {
        attemptedAliases.push(alias);
        if (attemptedAliases.length === 1) throw { status: 503 };
        return { model: alias, request: currentRequest, provider: 'test', status: 'mock' };
      },
    };

    const result = await executeWithFallback('planning_research_synthesis', request, { estimatedCost: 0.1 }, client);

    assert.deepEqual(new FallbackChain('creature-strong').models, ['creature-strong', 'creature-strong']);
    assert.deepEqual(attemptedAliases, ['creature-strong', 'creature-strong']);
    assert.equal(result.kind, 'completed');
    assert.equal(result.response.request, request);
  });

  test('rejects estimated spend above the alias ceiling', () => {
    const decision = routeModel('high_impact_drafting', {}, { estimatedCost: 1.51 });

    assert.equal(decision.kind, 'rejected');
    assert.equal(decision.reason, 'budget_exceeded');
  });
});
