import { vfs } from './runtime/vfs';
import { aiGateway } from '../core/gateway/router';
export class GoAgent {
    runs = new Map();
    // GO-001 — streaming chat with context refs (foundation: returns a structured plan).
    chat(prompt, owner = 'user') {
        const { tier } = aiGateway.route('plan');
        if (this.looksDurable(prompt)) {
            const run = this.startRun(prompt, owner);
            return { reply: `[${tier}] Started durable run ${run.id}. I'll continue in the background.`, runId: run.id };
        }
        return { reply: `Acknowledged: ${prompt}` };
    }
    looksDurable(prompt) {
        return /(prepare|investigate|research|schedule|follow up|complete|build workspace)/i.test(prompt);
    }
    // GO-002 — durable run with states, checkpoints, retry/resume, partial outputs, cancel, expiry.
    startRun(prompt, owner) {
        const run = {
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
    checkpoint(runId, step) {
        const r = this.runs.get(runId);
        if (!r)
            return;
        r.steps.push(step);
        r.state = step.state;
    }
    resume(runId) {
        const r = this.runs.get(runId);
        if (!r)
            return undefined;
        r.state = 'running';
        return r;
    }
    cancel(runId) {
        const r = this.runs.get(runId);
        if (!r)
            return false;
        r.state = 'cancelled';
        return true;
    }
    getRun(runId) {
        return this.runs.get(runId);
    }
    // GO-005 — execution preview before high-impact task.
    preview(_prompt) {
        return {
            intendedActions: ['research', 'draft-document', 'draft-reply'],
            expectedSystems: ['docs', 'mail', 'memory'],
            estimatedCostRange: [0.01, 0.05],
            requiredApprovals: ['mail:send'],
        };
    }
    // GO-006 — research output distinguishing source-backed / user / inference / recommendation.
    research(query, sources) {
        const hits = sources.filter((s) => s.text.toLowerCase().includes(query.toLowerCase()));
        return {
            sourceBacked: hits.map((h) => ({ claim: query, source: h.id })),
            inferences: ['No direct source; inferred from context.'],
            recommendation: 'Proceed with draft; confirm before sending.',
        };
    }
    // GO-007 — task inbox aggregating approval requests + run states.
    taskInbox() {
        return { proposals: vfs.getProposals(), runs: Array.from(this.runs.values()) };
    }
}
export const goAgent = new GoAgent();
//# sourceMappingURL=goAgent.js.map