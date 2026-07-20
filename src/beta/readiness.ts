export const BETA_JOURNEYS = [
  "email-to-work",
  "document-improvement",
  "automation-simulation",
  "project-workspace",
] as const;

export type BetaJourney = (typeof BETA_JOURNEYS)[number];

export type DeterministicJourneyEvidence = {
  day: number;
  journey: BetaJourney;
  passed: boolean;
  safetyChecks: readonly string[];
  telemetryEvents: readonly string[];
};

export type BetaReadinessReport = {
  deterministic: true;
  evidenceDays: number[];
  expectedChecks: number;
  passedChecks: number;
  reliabilityRate: number;
  safetyCoverage: number;
  telemetryCoverage: number;
  isDeterministicallyReady: boolean;
  humanObservationPending: true;
};

/**
 * Evaluates repeatable fixture evidence only. It intentionally does not treat
 * repeated executions as observed production days or as a human beta sign-off.
 */
export function evaluateDeterministicReadiness(
  evidence: readonly DeterministicJourneyEvidence[],
): BetaReadinessReport {
  const expectedChecks = BETA_JOURNEYS.length * 7;
  const evidenceDays = [...new Set(evidence.map((entry) => entry.day))].sort((a, b) => a - b);
  const passedChecks = evidence.filter((entry) => entry.passed).length;
  const safetyChecks = evidence.filter((entry) => entry.safetyChecks.length > 0).length;
  const telemetryChecks = evidence.filter((entry) => entry.telemetryEvents.includes("journey.completed")).length;
  const reliabilityRate = expectedChecks === 0 ? 0 : passedChecks / expectedChecks;
  const safetyCoverage = expectedChecks === 0 ? 0 : safetyChecks / expectedChecks;
  const telemetryCoverage = expectedChecks === 0 ? 0 : telemetryChecks / expectedChecks;
  const sevenDistinctDays = evidenceDays.length === 7 && evidenceDays.every((day, index) => day === index + 1);

  return {
    deterministic: true,
    evidenceDays,
    expectedChecks,
    passedChecks,
    reliabilityRate,
    safetyCoverage,
    telemetryCoverage,
    isDeterministicallyReady: sevenDistinctDays
      && evidence.length === expectedChecks
      && reliabilityRate === 1
      && safetyCoverage === 1
      && telemetryCoverage === 1,
    humanObservationPending: true,
  };
}
