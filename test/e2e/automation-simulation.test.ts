import assert from "node:assert/strict";
import test from "node:test";

type MailRule = { query: string; label: string };

class MockMailAutomation {
  readonly externalActions: string[] = [];

  createRule(query: string, label: string): MailRule { return { query, label }; }

  async run(rule: MailRule, messages: string[], dryRun: boolean): Promise<string[]> {
    const matches = messages.filter((message) => message.includes(rule.query));
    if (!dryRun) matches.forEach((message) => this.externalActions.push(`label:${message}:${rule.label}`));
    return matches;
  }
}

test("simulates a mail automation rule without external writes", async () => {
  const automation = new MockMailAutomation();
  const rule = automation.createRule("invoice", "Finance");
  const simulated = await automation.run(rule, ["invoice July", "team update", "invoice August"], true);

  assert.deepEqual(simulated, ["invoice July", "invoice August"]);
  assert.deepEqual(automation.externalActions, []);

  await automation.run(rule, simulated, false);
  assert.deepEqual(automation.externalActions, ["label:invoice July:Finance", "label:invoice August:Finance"]);
});
