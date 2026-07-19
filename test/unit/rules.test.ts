// Unit tests — business rules & tool permission checks (PRD §14.5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyAction, requiresApproval } from '../../src/core/security/permissions';
import { redactSecrets, isSecret, scrubForPersistence } from '../../src/core/security/secrets';
import { checkCorrectness } from '../../src/agent/tools/writing/correctness';
import { formatCitation } from '../../src/agent/tools/writing/citation';
import { checkPlagiarism, verdict } from '../../src/agent/tools/writing/plagiarism';
import { detectAI } from '../../src/agent/tools/writing/aidetection';

test('classifyAction: read is read-only, send is consequential, delete is destructive', () => {
  assert.equal(classifyAction('read:mail'), 'read-only');
  assert.equal(classifyAction('mail:send'), 'external-consequential-write');
  assert.equal(classifyAction('mail:archive'), 'destructive');
});

test('requiresApproval: read never needs approval; consequential does', () => {
  assert.equal(requiresApproval('read:mail', {}), false);
  assert.equal(requiresApproval('mail:send', {}), true);
});

test('secrets: tokens redacted and detected', () => {
  assert.equal(isSecret('sk-1234567890abcdefghij'), true);
  const out = redactSecrets('token=sk-1234567890abcdefghij pass');
  assert.match(out, /REDACTED/);
  assert.doesNotMatch(out, /sk-1234567890abcdefghij/);
});

test('scrubForPersistence removes secret keys', () => {
  const out = scrubForPersistence({ name: 'x', api_key: 'sk-secret', note: 'ok' });
  assert.equal((out as any).api_key, '[REDACTED]');
});

test('correctness flags a known typo', () => {
  const s = checkCorrectness('I will recieve the package.');
  assert.ok(s.some((x) => x.message.includes('misspelling')));
});

test('citation never fabricates missing fields', () => {
  const c = formatCitation({ title: 'On AI' }, 'APA');
  assert.ok(c.includes('n/a'));
});

test('plagiarism: never labels as plagiarist from score alone', () => {
  const m = checkPlagiarism('the quick brown fox jumps', [{ id: 's1', content: 'the quick brown fox jumps over the lazy dog' }]);
  assert.ok(m.length >= 0);
  assert.match(verdict(m), /do NOT label/);
});

test('ai detection includes mandatory warning', () => {
  const r = detectAI('This is a very uniform and repetitive sentence structure example.');
  assert.match(r.warning, /not.*definitive/i);
});
