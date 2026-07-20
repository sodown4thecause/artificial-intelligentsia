import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemoryFeatureFlagAuditLog } from '../../src/features/audit.js';
import { FEATURE_FLAGS, RISKY_FEATURE_FLAGS } from '../../src/features/flags.js';
import { FeatureFlagStore } from '../../src/features/store.js';

test('FeatureFlagStore defaults risky flags to disabled when no configuration exists', () => {
    const store = new FeatureFlagStore(RISKY_FEATURE_FLAGS);

    assert.equal(store.isEnabled(FEATURE_FLAGS.TOOL_WRITE_ACTIONS.name), false);
    assert.equal(store.isEnabled('not-configured'), false);
});

test('FeatureFlagStore supports platform, workspace, user, and cohort changes without a redeploy', () => {
    const store = new FeatureFlagStore(RISKY_FEATURE_FLAGS);
    const flag = FEATURE_FLAGS.AUTOMATION_AUTO_SEND.name;

    store.setOverride({ flag, scope: 'platform', value: true, actorId: 'admin', reason: 'approved rollout' });
    store.setOverride({ flag, scope: 'workspace', scopeId: 'workspace-a', value: false, actorId: 'admin', reason: 'workspace opt-out' });
    store.setOverride({ flag, scope: 'user', scopeId: 'user-a', value: false, actorId: 'admin', reason: 'user opt-out' });
    store.setOverride({ flag, scope: 'cohort', scopeId: 'early-access', value: true, actorId: 'admin', reason: 'cohort rollout' });

    assert.equal(store.isEnabled(flag), true);
    assert.equal(store.isEnabled(flag, { workspaceId: 'workspace-a' }), false);
    assert.equal(store.isEnabled(flag, { userId: 'user-a' }), false);
    assert.equal(store.isEnabled(flag, { cohort: 'early-access' }), true);
});

test('FeatureFlagStore audits each configuration change with the actor, reason, and prior value', () => {
    const auditLog = new InMemoryFeatureFlagAuditLog();
    const changedAt = new Date('2026-07-20T12:00:00.000Z');
    const store = new FeatureFlagStore(RISKY_FEATURE_FLAGS, { auditLog, now: () => changedAt });
    const flag = FEATURE_FLAGS.CONNECTOR_WRITE_SYNC.name;

    store.setOverride({ flag, scope: 'workspace', scopeId: 'workspace-a', value: true, actorId: 'admin', reason: 'pilot' });
    store.setOverride({ flag, scope: 'workspace', scopeId: 'workspace-a', value: false, actorId: 'admin', reason: 'rollback' });

    assert.deepEqual(auditLog.list(), [
      { flag, scope: 'workspace', scopeId: 'workspace-a', value: true, actorId: 'admin', reason: 'pilot', changedAt },
      { flag, scope: 'workspace', scopeId: 'workspace-a', value: false, actorId: 'admin', reason: 'rollback', previousValue: true, changedAt },
    ]);
});
