import { vfs } from '../runtime/vfs';
export class AutomationEngine {
    automations = new Map();
    dailyCounts = new Map();
    create(def) {
        const full = { ...def, audit: [] };
        this.automations.set(full.id, full);
        return full;
    }
    update(id, patch) {
        const a = this.automations.get(id);
        if (!a)
            return undefined;
        Object.assign(a, patch);
        return a;
    }
    delete(id) {
        return this.automations.delete(id);
    }
    get(id) {
        return this.automations.get(id);
    }
    list() {
        return Array.from(this.automations.values());
    }
    // AUTO-003 — enforce safety limits before any execution.
    enforceSafety(a, ctx) {
        const limits = a.safety;
        const today = new Date(ctx.now ?? Date.now()).toISOString().slice(0, 10);
        const dc = this.dailyCounts.get(a.id);
        if (limits.maxDailyActions != null) {
            if (!dc || dc.date !== today)
                this.dailyCounts.set(a.id, { date: today, count: 0 });
            if (this.dailyCounts.get(a.id).count + (ctx.proposedActions?.length ?? 0) > limits.maxDailyActions) {
                return 'maxDailyActions exceeded';
            }
        }
        if (limits.maxActionsPerRun != null && (ctx.proposedActions?.length ?? 0) > limits.maxActionsPerRun)
            return 'maxActionsPerRun exceeded';
        if (limits.permittedHours && limits.permittedHours.length === 2) {
            const hour = new Date(ctx.now ?? Date.now()).getHours();
            if (hour < limits.permittedHours[0] || hour > limits.permittedHours[1])
                return 'outside permittedHours';
        }
        return null;
    }
    // AUTO-002 — mode-driven behavior.
    run(a, ctx) {
        const safetyError = this.enforceSafety(a, ctx);
        if (safetyError) {
            a.audit.push(this.auditEvent(a.id, 'safety-blocked', safetyError));
            return { mode: a.mode, outcome: `blocked: ${safetyError}` };
        }
        switch (a.mode) {
            case 'disabled':
                return { mode: a.mode, outcome: 'no-op (disabled)' };
            case 'simulation': {
                const matches = ctx.matchedMessages?.length ?? 0;
                return { mode: a.mode, outcome: `simulation: ${matches} message(s) would match; no actions taken` };
            }
            case 'dry-run': {
                const proposals = (ctx.proposedActions ?? []).map((p) => vfs.propose(p.action, p.args, { summary: `[dry-run] ${a.name}`, impact: 'LOW' }));
                return { mode: a.mode, outcome: 'dry-run: actions proposed, not committed', proposals };
            }
            case 'approval-required': {
                const proposals = (ctx.proposedActions ?? []).map((p) => vfs.propose(p.action, p.args, { summary: `[approval-required] ${a.name}`, impact: 'MEDIUM' }));
                return { mode: a.mode, outcome: 'proposed; awaiting approval', proposals };
            }
            case 'active': {
                const proposals = (ctx.proposedActions ?? []).map((p) => vfs.propose(p.action, p.args, { summary: `[active] ${a.name}`, impact: 'HIGH' }));
                // active still stages via VFS; commit requires explicit user approval per permission policy.
                return { mode: a.mode, outcome: 'active: actions staged for execution', proposals };
            }
            default:
                return { mode: a.mode, outcome: 'unknown mode' };
        }
    }
    auditEvent(automationId, trigger, note) {
        return { id: `aud_${Math.random().toString(36).slice(2, 11)}`, actor: automationId, trigger, inputs: note, toolsCalled: [], permissionsUsed: [], approvals: [], externalChanges: [], at: Date.now() };
    }
}
//# sourceMappingURL=engine.js.map