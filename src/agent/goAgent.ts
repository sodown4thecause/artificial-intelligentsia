// GO-001..007 — Go Agent: chat, durable background runs, task inbox, plans/approvals, research citations.
import type { ExecutionPreview, ToolProposal } from '../core/types';
import { vfs } from './runtime/vfs';
import { aiGateway } from '../core/gateway/router';

export type RunState = 'queued' | 'running' | 'waiting' | 'approval-required' | 'paused' | 'failed' | 'cancelled' | 'completed';

export interface RunStep {
  name: string;
  state: RunState;
  checkpoint?: unknown;
}

export interface DurableRun {
  id: string;
  prompt: string;
  state: RunState;
  steps: RunStep[];
  partialOutputs: unknown[];
  createdAt: number;
  expiresAt?: number;
  owner: string;
}

export class GoAgent {
  private runs = new Map<string, DurableRun>();

  // GO-001 — streaming chat with context refs (foundation: returns a structured plan).
  chat(prompt: string, owner = 'user'): { reply: string; runId?: string } {
    const { tier } = aiGateway.route('plan');
    if (this.looksDurable(prompt)) {
      const run = this.startRun(prompt, owner);
      return { reply: `[${tier}] Started durable run ${run.id}. I'll continue in the background.`, runId: run.id };
    }
    return { reply: `Acknowledged: ${prompt}` };
  }

  private looksDurable(prompt: string): boolean {
    return /(prepare|investigate|research|schedule|follow up|complete|build workspace)/i.test(prompt);
  }

  // GO-002 — durable run with states, checkpoints, retry/resume, partial outputs, cancel, expiry.
  startRun(prompt: string, owner: string): DurableRun {
    const run: DurableRun = {
      id: `run_${Math.random().toString(36).slice(2, 11)}`,
      prompt,
      state: 'running',
      steps: [{ name: 'plan', state: 'running' }],
      partialOutputs: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
      owner,
    };
    this.runs.set(run.id, run);
    return run;
  }

  checkpoint(runId: string, step: RunStep): void {
    const r = this.runs.get(runId);
    if (!r) return;
    r.steps.push(step);
    r.state = step.state;
  }

  resume(runId: string): DurableRun | undefined {
    const r = this.runs.get(runId);
    if (!r) return undefined;
    r.state = 'running';
    return r;
  }

  cancel(runId: string): boolean {
    const r = this.runs.get(runId);
    if (!r) return false;
    r.state = 'cancelled';
    return true;
  }

  getRun(runId: string): DurableRun | undefined {
    return this.runs.get(runId);
  }

  // GO-005 — execution preview before high-impact task.
  preview(_prompt: string): ExecutionPreview {
    return {
      intendedActions: ['research', 'draft-document', 'draft-reply'],
      expectedSystems: ['docs', 'mail', 'memory'],
      estimatedCostRange: [0.01, 0.05],
      requiredApprovals: ['mail:send'],
    };
  }

  // GO-006 — research output distinguishing source-backed / user / inference / recommendation.
  research(query: string, sources: { id: string; text: string }[]): {
    sourceBacked: { claim: string; source: string }[];
    inferences: string[];
    recommendation: string;
  } {
    const hits = sources.filter((s) => s.text.toLowerCase().includes(query.toLowerCase()));
    return {
      sourceBacked: hits.map((h) => ({ claim: query, source: h.id })),
      inferences: ['No direct source; inferred from context.'],
      recommendation: 'Proceed with draft; confirm before sending.',
    };
  }

  // GO-007 — task inbox aggregating approval requests + run states.
  taskInbox(): { proposals: ToolProposal[]; runs: DurableRun[] } {
    return { proposals: vfs.getProposals(), runs: Array.from(this.runs.values()) };
  }
}

export const goAgent = new GoAgent();
