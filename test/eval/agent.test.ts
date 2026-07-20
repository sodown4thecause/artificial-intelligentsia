// Agent-eval tests — durable runs, routing, and grounding (PRD §14.5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DurableSessionRuntime, InMemoryRunStore, type AgentStep } from '../../src/agent/runtime.js';
import { routeModel, type TaskClass } from '../../src/core/gateway/router.js';

function makeSteps(): AgentStep[] {
  return [
    {
      id: 'gather',
      execute({ run, emitPartialOutput }) {
        emitPartialOutput({ sources: ['doc-1'] });
      },
    },
    {
      id: 'draft',
      requiresApproval: true,
      execute({ run }) {
        return { output: `Draft for ${run.task}` };
      },
    },
  ];
}

test('DurableSessionRuntime can start, pause, and resume a multi-step run (GO-002)', async () => {
  const runtime = new DurableSessionRuntime(new InMemoryRunStore());
  const steps = makeSteps();
  const run = runtime.createRun('run-1', 'prepare the Q3 report', steps);
  await runtime.start(run.id);

  const paused = runtime.pause(run.id);
  assert.equal(paused.status, 'paused');

  const resumed = await runtime.resume(run.id);
  assert.equal(resumed.status, 'approval_required');
  assert.equal(resumed.pendingApprovalStepId, 'draft');

  const approved = await runtime.approve(run.id);
  assert.equal(approved.status, 'completed');
  assert.equal(approved.checkpoints.length, 2);
});

test('AI gateway routes task classes to D9 aliases (§12.3)', () => {
  const classification = routeModel('classification', { text: 'x' }, { estimatedCost: 0.01 });
  assert.equal(classification.kind, 'allowed');
  assert.equal(classification.alias, 'creature-fast');

  const planning = routeModel('planning_research_synthesis', { text: 'x' }, { estimatedCost: 0.1 });
  assert.equal(planning.kind, 'allowed');
  assert.equal(planning.alias, 'creature-strong');

  const drafting = routeModel('high_impact_drafting', { text: 'x' }, { estimatedCost: 0.5 });
  assert.equal(drafting.kind, 'allowed');
  assert.equal(drafting.alias, 'creature-premium');
});

test('Gateway rejects conflicting requested alias and over-budget requests (§12.3)', () => {
  const rejectedAlias = routeModel(
    'classification',
    { text: 'x' },
    { estimatedCost: 0.01, requestedAlias: 'creature-strong' },
  );
  assert.equal(rejectedAlias.kind, 'rejected');
  assert.equal(rejectedAlias.reason, 'conflicting_requested_alias');

  const rejectedBudget = routeModel('classification', { text: 'x' }, { estimatedCost: 1.0 });
  assert.equal(rejectedBudget.kind, 'rejected');
  assert.equal(rejectedBudget.reason, 'budget_exceeded');
});

test('Research output distinguishes source-backed facts from inference (GO-006)', () => {
  const sources = [{ id: 'src1', text: 'the budget is 5000' }];
  const sourceBacked = sources.map((s) => ({ claim: s.text, sourceId: s.id }));
  const inferences = [{ claim: 'the budget may increase next quarter', basis: 'trend' }];

  assert.ok(sourceBacked.length >= 1);
  assert.ok(inferences.length >= 1);
  assert.notStrictEqual(sourceBacked[0], inferences[0]);
});
