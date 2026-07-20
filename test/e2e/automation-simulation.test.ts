import assert from "node:assert/strict";
import test from "node:test";

type MailRule = { query: string; label: string; state: "draft" | "active" };
type Run = { id: string; dryRun: boolean; proposals: string[]; applied: string[]; reversed: boolean };

class MockMailAutomation {
  readonly externalActions: string[] = [];
  readonly telemetry: string[] = [];
  readonly runs: Run[] = [];

  createRule(query: string, label: string): MailRule { return { query, label, state: "draft" }; }

  async simulate(rule: MailRule, messages: string[]): Promise<string[]> {
    const matches = messages.filter((message) => message.includes(rule.query));
    this.runs.push({ id: `run-${this.runs.length + 1}`, dryRun: true, proposals: matches, applied: [], reversed: false });
    this.telemetry.push("automation.simulated");
    return matches;
  }

  promote(rule: MailRule, approved: boolean): MailRule {
    if (!approved) throw new Error("Approval is required before activating automation");
    this.telemetry.push("automation.promoted");
    return { ...rule, state: "active" };
  }

  async run(rule: MailRule, proposals: string[]): Promise<Run> {
    if (rule.state !== "active") throw new Error("Only approved active rules can apply proposals");
    const run = { id: `run-${this.runs.length + 1}`, dryRun: false, proposals, applied: [...proposals], reversed: false };
    proposals.forEach((message) => this.externalActions.push(`label:${message}:${rule.label}`));
    this.runs.push(run);
    this.telemetry.push("automation.applied");
    return run;
  }

  reverse(run: Run): void {
    if (run.dryRun) throw new Error("Dry-run proposals have nothing to reverse");
    run.applied.forEach((message) => this.externalActions.push(`remove-label:${message}`));
    run.reversed = true;
    this.telemetry.push("automation.reversed");
  }
}

test("simulates, approves, runs, records, and reverses structured inbox automation", async () => {
  const automation = new MockMailAutomation();
  const rule = automation.createRule("invoice", "Finance");
  const simulated = await automation.simulate(rule, ["invoice July", "team update", "invoice August"]);

  assert.deepEqual(simulated, ["invoice July", "invoice August"]);
  assert.deepEqual(automation.externalActions, []);
  await assert.rejects(() => automation.run(rule, simulated), /approved active rules/);
  assert.throws(() => automation.promote(rule, false), /Approval is required/);

  const activeRule = automation.promote(rule, true);
  const run = await automation.run(activeRule, simulated);
  assert.deepEqual(automation.runs.map(({ dryRun, proposals }) => ({ dryRun, proposals })), [
    { dryRun: true, proposals: ["invoice July", "invoice August"] },
    { dryRun: false, proposals: ["invoice July", "invoice August"] },
  ]);
  automation.reverse(run);
  assert.equal(run.reversed, true);
  assert.deepEqual(automation.externalActions, ["label:invoice July:Finance", "label:invoice August:Finance", "remove-label:invoice July", "remove-label:invoice August"]);
  assert.deepEqual(automation.telemetry, ["automation.simulated", "automation.promoted", "automation.applied", "automation.reversed"]);
});
