# Phase 3.12 beta readiness

## Evidence status

This document records deterministic fixture evidence, not seven calendar days of production or beta use. The deterministic harness repeats the four journeys across labelled runs 1–7 and **does not** claim that people observed the product for seven days. Human observation and release sign-off remain pending.

## Journey matrix

| Journey | Deterministic proof | Safety and telemetry proof |
| --- | --- | --- |
| Email request to work | Persists research, creates cited supporting document and cited draft, approves it, then tests memory disabled and enabled. | No draft is approved before the explicit approval event; memory is opt-in; lifecycle telemetry is asserted. |
| Document improvement | Groups high/low clarity/tone suggestions, accepts one, rewrites, and returns editable version 3. | Acceptance and rewrite telemetry are asserted; versioned output remains editable. |
| Inbox automation | Simulates historical matches, rejects unapproved activation/application, promotes only after approval, records a run, and reverses labels. | Simulation has no external writes; promotion, apply, and reversal telemetry are asserted. |
| Project workspace | Uses mail, calendar, file, and document fixtures to provide status, decisions, questions, owners, next actions, and a grounded answer. | All returned citations are canonical fixture URLs; AI-view and grounded-answer telemetry are asserted. |

## Quantitative deterministic thresholds

`test/e2e/beta-readiness.test.ts` requires 28 successful checks: four journeys on each of seven labelled deterministic runs. Readiness requires all of the following:

- Reliability: 28/28 passing checks (100%).
- Safety coverage: 28/28 checks include at least one explicit safety assertion (100%).
- Telemetry coverage: 28/28 checks include `journey.completed` (100%).
- No unapproved consequential automation writes; each applied automation run has a recorded reversal path.
- Grounded workspace answers only cite canonical sources represented in the fixture data.

The harness reports `deterministic: true` and `humanObservationPending: true`; it cannot prove connector health, production reliability, external-side reversals, or human outcomes.

## Pending human seven-day observation and sign-off

Before beta promotion, the release owner must collect seven consecutive calendar days of observed beta evidence, review support/telemetry and reconciliation results daily, validate any live connector scope and health with authorized accounts, execute a rollback drill, and record a human sign-off. Until then, this phase is deterministically ready only—not beta-approved.
