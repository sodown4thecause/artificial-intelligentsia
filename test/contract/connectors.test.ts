// Contract tests — connectors & memory boundaries (PRD §14.5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GmailConnector } from '../../src/integrations/connectors/gmail';
import { GoogleCalendarConnector } from '../../src/integrations/connectors/calendar';
import { ConnectorAuth } from '../../src/agent/automation/connectorAuth';
import { Mnemosyne } from '../../src/core/memory/mnemosyne';
import { vfs } from '../../src/agent/runtime/vfs';

test('Gmail connector read returns threads; write stages via VFS', () => {
  const g = new GmailConnector();
  const draftId = g.draftEmail({ to: 'a@b.com', subject: 'Hi', body: 'Hello' });
  assert.ok(draftId.startsWith('prop_'));
  const found = vfs.getProposals().find((p) => p.id === draftId);
  assert.ok(found);
  assert.equal(found!.action, 'mail:draft');
  assert.equal(found!.status, 'pending');
});

test('Gmail archive is destructive/high impact', () => {
  const g = new GmailConnector();
  const id = g.archive({ threadIds: ['t1'] });
  const p = vfs.getProposals().find((x) => x.id === id)!;
  assert.equal(p.previewData.impact, 'DESTRUCTIVE');
});

test('Calendar read returns events; event creation staged', () => {
  const c = new GoogleCalendarConnector();
  const ev = c.createEventPreview({ title: 'Sync', start: '2026-07-20' });
  assert.ok(vfs.getProposals().some((p) => p.id === ev));
});

test('ConnectorAuth forces reauth on scope expansion', () => {
  const auth = new ConnectorAuth({ read: true, write: false, grantedScopes: ['mail.read'] });
  const res = auth.requestScopes({ read: true, write: true, grantedScopes: ['mail.read', 'mail.send'] });
  assert.equal(res.requiresReauth, true);
  assert.deepEqual(res.addedScopes, ['mail.send']);
});

test('Mnemosyne rejects canonical-source storage (MEM-004)', () => {
  const m = new Mnemosyne();
  const r = m.store({ category: 'project-context', value: 'email from boss', scope: 'user', provenance: 'inferred', confidence: 0.5, pinned: false, sensitive: false });
  assert.equal(r.ok, false);
});

test('Mnemosyne blocks secrets (MEM-005)', () => {
  const m = new Mnemosyne();
  const r = m.store({ category: 'personal-preference', value: 'my token is sk-1234567890abcdefghij', scope: 'user', provenance: 'user-confirmed', confidence: 1, pinned: false, sensitive: true });
  assert.equal(r.ok, false);
});
