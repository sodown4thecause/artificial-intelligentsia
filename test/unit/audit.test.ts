import assert from 'node:assert/strict';
import test from 'node:test';

import { recordAuditEvent } from '../../src/core/audit/hook.js';
import { InMemoryAuditStore } from '../../src/core/audit/store.js';
import { AuditEventInputSchema, createSensitiveContentReference, type AuditEventInput } from '../../src/core/audit/types.js';

function eventInput(overrides: Partial<AuditEventInput> = {}): AuditEventInput {
  return {
    runId: 'run-123',
    actor: { id: 'user-1', type: 'user' },
    agent: { id: 'mail-agent', version: '1.2.3' },
    trigger: { type: 'user', reference: null },
    inputReferences: [{ id: 'input-1', system: 'mail', kind: 'message' }],
    sourceReferences: [{ id: 'source-1', system: 'drive', kind: 'document' }],
    toolsCalled: [{ name: 'mail.draft', inputReferences: [], outputReferences: [], status: 'succeeded' }],
    permissionsUsed: ['mail.compose'],
    approvals: [{ id: 'approval-1', status: 'approved', approver: { id: 'user-1', type: 'user' } }],
    externalChanges: [{ action: 'created-draft', target: { id: 'draft-1', system: 'mail', kind: 'draft' }, result: 'applied' }],
    outputReferences: [{ id: 'output-1', system: 'mail', kind: 'draft' }],
    cost: { amount: 0.002, currency: 'usd' },
    durationMs: 42,
    state: 'succeeded',
    error: null,
    retry: { attempt: 0, maxAttempts: 3, nextRetryAt: null },
    ...overrides,
  };
}

test('appends complete, immutable, hash-chained audit events', () => {
  const store = new InMemoryAuditStore();
  const first = store.append(eventInput());
  const second = store.append(eventInput({ runId: 'run-456' }));

  assert.match(first.id, /^audit_evt_[A-Za-z0-9_-]{32,}$/);
  assert.ok(Object.isFrozen(first));
  assert.equal(second.previousHash, first.hash);
  assert.notEqual(first.hash, second.hash);
  assert.throws(() => {
    (first as AuditEventInput).runId = 'tampered';
  }, TypeError);
});

test('queries audit events by run, actor, and inclusive time range', () => {
  const store = new InMemoryAuditStore();
  const early = store.append(eventInput({ occurredAt: '2026-07-20T09:00:00.000Z' }));
  store.append(eventInput({ runId: 'run-456', actor: { id: 'agent-1', type: 'agent' }, occurredAt: '2026-07-20T11:00:00.000Z' }));

  assert.deepEqual(store.getByRunId('run-123').map((event) => event.id), [early.id]);
  assert.equal(store.getByActor('agent-1').length, 1);
  assert.equal(store.getByTimeRange({ from: '2026-07-20T09:00:00.000Z', to: '2026-07-20T09:00:00.000Z' }).length, 1);
});

test('uses opaque secure references instead of raw sensitive content', () => {
  const reference = createSensitiveContentReference('credential-vault');
  assert.match(reference.id, /^sensitive_[A-Za-z0-9_-]{32,}$/);
  assert.equal('value' in reference, false);

  assert.throws(
    () =>
      AuditEventInputSchema.parse({
        ...eventInput(),
        inputReferences: [{ ...reference, value: 'do-not-store-me' }],
      }),
    /Unrecognized key/,
  );
});

test('recordAuditEvent writes through the supplied hook store', () => {
  const store = new InMemoryAuditStore();
  const event = recordAuditEvent(eventInput(), store);
  assert.equal(store.getByRunId(event.runId)[0]?.id, event.id);
});
