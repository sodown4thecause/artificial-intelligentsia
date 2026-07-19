// Agent-eval tests — drafting, summarization, grounding, tool selection (PRD §14.5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compose } from '../../src/agent/tools/writing/compose';
import { MailDomain } from '../../src/agent/tools/mail';
import { GoAgent } from '../../src/agent/goAgent';
import { aiGateway } from '../../src/core/gateway/router';
import { runEval, traceRun } from '../../src/core/evals/braintrust';

test('compose assembles outline + sources', () => {
  const [result] = runEval('drafting', compose, [
    { prompt: 'Draft Q3 plan', outline: ['Goals', 'Risks'], sources: ['doc-1'] },
  ]);
  const out = result.output;
  assert.match(out, /Goals/);
  assert.match(out, /doc-1/);
  assert.equal(result.score, 1);
});

test('mail summarize preserves required dimensions (MAIL-010)', () => {
  const m = new MailDomain();
  const [result] = runEval('summarization', (threadId: string) => m.summarize(threadId), ['t1']);
  const r = result.output;
  for (const dim of ['open questions', 'decisions', 'commitments', 'owners', 'dates']) {
    assert.ok(r.preserved.includes(dim), `missing ${dim}`);
  }
});

test('Go Agent durable run can be resumed (GO-002)', () => {
  const g = new GoAgent();
  const [result] = runEval('durable-run', (message: string) => g.chat(message), [
    'prepare the Q3 report and schedule follow-ups',
  ]);
  const { runId } = result.output;
  assert.ok(runId);
  traceRun(runId!, [{ type: 'chat', status: 'started' }]);
  const resumed = g.resume(runId!);
  assert.equal(resumed!.state, 'running');
});

test('Go Agent research distinguishes source-backed from inference (GO-006)', () => {
  const g = new GoAgent();
  const [result] = runEval('research-grounding', (query: string) => g.research(query, [
    { id: 'src1', text: 'the budget is 5000' },
  ]), ['budget']);
  const r = result.output;
  assert.ok(r.sourceBacked.length >= 1);
  assert.ok(r.inferences.length >= 1);
});

test('AI gateway routes routine to cheap, complex to strong (§12.3)', () => {
  const results = runEval('tool-selection', (intent: string) => aiGateway.route(intent), [
    'summarize',
    'research',
  ]);
  assert.equal(results[0].output.tier, 'cheap');
  assert.equal(results[1].output.tier, 'strong');
});
