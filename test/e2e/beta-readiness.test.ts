import assert from "node:assert/strict";
import test from "node:test";
import { BETA_JOURNEYS, evaluateDeterministicReadiness } from "../../src/beta/readiness.js";

test("deterministic seven-run evidence meets thresholds without representing human observation as complete", () => {
  const evidence = Array.from({ length: 7 }, (_, index) =>
    BETA_JOURNEYS.map((journey) => ({
      day: index + 1,
      journey,
      passed: true,
      safetyChecks: ["approval-or-no-external-write", "canonical-citation-or-version"],
      telemetryEvents: ["journey.completed"],
    })),
  ).flat();
  const report = evaluateDeterministicReadiness(evidence);

  assert.deepEqual(report.evidenceDays, [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(report.expectedChecks, 28);
  assert.equal(report.passedChecks, 28);
  assert.equal(report.reliabilityRate, 1);
  assert.equal(report.safetyCoverage, 1);
  assert.equal(report.telemetryCoverage, 1);
  assert.equal(report.isDeterministicallyReady, true);
  assert.equal(report.humanObservationPending, true);
});
