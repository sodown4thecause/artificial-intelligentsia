import assert from 'node:assert/strict';
import test from 'node:test';

import { AuditAccessDeniedError, type AuditAccessPrincipal } from '../../src/core/audit/access.js';
import { queryAuditEvents, queryAuditEventsByActor, queryAuditEventsByRunId, queryAuditEventsByTimeRange } from '../../src/core/audit/query.js';
import { InMemoryAuditStore, verifyAuditEventChain } from '../../src/core/audit/store.js';
import type { AuditEventInput } from '../../src/core/audit/types.js';

const auditor: AuditAccessPrincipal = {
  id: 'user-auditor',
  workspaceRoles: { 'workspace-a': 'auditor' },
};

const outsider: AuditAccessPrincipal = { id: 'user-outsider', workspaceRoles: {} };

function event(overrides: Partial<AuditEventInput> = {}): AuditEventInput {
  return {
    workspaceId: 'workspace-a',
    runId: 'run-1',
    actor: { id: 'user-1', type: 'user' },
    agent: { id: 'agent-1', version: '1.0.0' },
    trigger: { type: 'user', reference: null },
    inputReferences: [],
    sourceReferences: [],
    toolsCalled: [],
    permissionsUsed: [],
    approvals: [],
    externalChanges: [],
    outputReferences: [],
    cost: { amount: 0, currency: 'USD' },
    durationMs: 1,
    state: 'succeeded',
    error: null,
    retry: { attempt: 0, maxAttempts: 1, nextRetryAt: null },
    occurredAt: '2026-07-20T10:00:00.000Z',
    ...overrides,
  };
}

test('authorized users can inspect complete workspace lineage by supported filters', () => {
  const store = new InMemoryAuditStore();
  store.append(event());
  store.append(event({ runId: 'run-2', actor: { id: 'user-2', type: 'user' }, occurredAt: '2026-07-20T11:00:00.000Z' }));
  store.append(event({ workspaceId: 'workspace-b', runId: 'run-3' }));

  assert.equal(queryAuditEvents(store, auditor, { workspaceId: 'workspace-a' }).length, 2);
  assert.equal(queryAuditEventsByRunId(store, auditor, 'workspace-a', 'run-1').length, 1);
  assert.equal(queryAuditEventsByActor(store, auditor, 'workspace-a', 'user-2').length, 1);
  assert.equal(
    queryAuditEventsByTimeRange(store, auditor, 'workspace-a', {
      from: '2026-07-20T10:30:00.000Z',
      to: '2026-07-20T11:30:00.000Z',
    }).length,
    1,
  );
});

test('unauthorized users cannot read workspace audit records', () => {
  const store = new InMemoryAuditStore();
  store.append(event());

  assert.throws(
    () => queryAuditEvents(store, outsider, { workspaceId: 'workspace-a' }),
    AuditAccessDeniedError,
  );
});

test('audit records are immutable and their hash chain detects tampering', () => {
  const store = new InMemoryAuditStore();
  const first = store.append(event());
  const second = store.append(event({ runId: 'run-2' }));

  assert.equal(store.verifyIntegrity(), true);
  assert.throws(() => {
    (first.actor as { id: string }).id = 'attacker';
  }, TypeError);
  assert.equal(verifyAuditEventChain([{ ...first }, { ...second, state: 'failed' }]), false);
});
