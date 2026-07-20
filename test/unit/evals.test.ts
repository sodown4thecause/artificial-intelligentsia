import assert from "node:assert/strict";
import test from "node:test";
import { createEvalHarness } from "../../src/core/evals/braintrust.js";
import { baselineEvalDatasets } from "../../src/core/evals/datasets.js";

test("versioned eval harness runs every baseline dataset", () => {
  const harness = createEvalHarness();
  const results = Object.values(baselineEvalDatasets).flatMap((dataset) => harness.run(
    dataset,
    (input) => `${input.task} ${input.sources?.join(" ") ?? ""} simulation approval`,
    (output, expected) => expected.requiredTerms.every((term) => output.toLowerCase().includes(term.toLowerCase())) && !(expected.forbiddenTerms ?? []).some((term) => output.toLowerCase().includes(term.toLowerCase())) ? 1 : 0,
  ));
  assert.equal(harness.version, "1.0.0");
  assert.equal(results.length, 5);
  assert.ok(results.every((result) => result.passed));
});
