# W6 — MVP Acceptance Checklist & Test Matrix

Maps PRD §17 (13 acceptance criteria) + §16 Phase 0/1 exit criteria to test layers and journeys. Test layers: unit / contract / UI (Native SDK deterministic) / E2E / agent-eval / red-team.

## Acceptance criteria → test matrix
| # | Criterion (§17) | Test layers | Journey(s) |
|---|-----------------|-------------|------------|
| 1 | App installs/launches on Win/Mac/Linux | UI, E2E | — |
| 2 | Authenticate + connect Gmail & Google Calendar | contract (connector), E2E | J1, J4 |
| 3 | Go Agent durable multi-step, pause, resume after close | E2E, agent-eval | J1 |
| 4 | Editor: correctness/tone/rewrite/composition/proofread | unit, UI, agent-eval | J2 |
| 5 | Mail: search/summary/draft/event-preview | unit, contract, E2E | J1, J3 |
| 6 | All sends/event-consequential writes approval-gated | E2E, red-team | J1, J3 |
| 7 | Docs: pages/attachments/cache/version/share | unit, UI, E2E | J2, J4 |
| 8 | Inspect + delete stored memory | unit, UI | — |
| 9 | Every run exposes status/sources/tools/approvals/errors/outputs | E2E, agent-eval | all |
| 10 | No cross-workspace content leakage | red-team, contract | — |
| 11 | Connector tokens/secrets absent from prompts/logs/telemetry/memory | red-team, unit | — |
| 12 | Critical workflows pass deterministic desktop + E2E tests | UI, E2E | all |
| 13 | 7 days real tasks w/o separate tracking system | E2E, agent-eval | all |

## Phase 0 exit criteria (§16)
- Start/close/reopen/resume durable task → E2E + agent-eval (criterion 3 precursor).
- Risky mock tool pauses for approval + resumes → E2E (criterion 6 precursor).
- Desktop creds via OS credential service → unit + contract (criterion 11 precursor).

## Phase 1 exit criteria (§16)
- Complete 4 key journeys (§9) → E2E (criteria 1–9).
- No unsent/created external action w/o approval → red-team (criterion 6).
- Core flows pass Win/Mac/Linux desktop tests → UI (criterion 1, 12).

## Required assertions per layer
- **unit:** tool permission checks, citation non-fabrication, idempotency keys.
- **contract:** Gmail/Calendar/Connector schemas + token scope.
- **UI:** cold-start <2s, nav <100ms, suggestion <300ms (§14.1).
- **E2E:** journeys J1–J4 with approval pauses.
- **agent-eval:** drafting, summarization, grounding, automation-planning, tool-selection (§14.5).
- **red-team:** prompt injection, data exfil, unsafe writes, cross-workspace access (§14.5).
