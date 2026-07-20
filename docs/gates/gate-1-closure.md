# Gate 1 Closure Assessment — MVP Scope Lock

**Project:** Creature OS  
**Review date:** 2026-07-20  
**Gate status: BLOCKED.** Gate 1 cannot close until the blockers below are resolved and named humans sign the record.

## Scope and evidence rules

This assessment evaluates the 13 private-beta conditions in [PRD §17](../../prd/CREATURE_PRD_EVE_NATIVE_SDK.md#17-mvp-acceptance-criteria) against the current `main` state after PR #27 (`14b9972`). Local tests and deterministic fixtures are evidence of implementation behavior only. They are **not** evidence that native installers work, that authorized people used live providers, or that humans observed the product for seven calendar days.

`npm test` was recorded as passing 111 tests in the Gate 0 closure record before PR #27. PR #27 added deterministic platform-flow manifest coverage; this review must be re-verified after the record and evaluation test are merged.

## PRD §17 criterion-by-criterion assessment

| # | PRD §17 criterion | Status | Exact local evidence and remaining limitation |
| --- | --- | --- | --- |
| 1. | The native desktop app installs and launches on supported Windows, macOS, and Linux reference environments. | **BLOCKED** | [`test/unit/platform-matrix.test.ts`](../../test/unit/platform-matrix.test.ts) checks deterministic native-library extensions and paths; [`test/e2e/platform-critical-flows.test.ts`](../../test/e2e/platform-critical-flows.test.ts) checks the shared flow manifest. No Windows/MSI, macOS/package, or Linux/package installer artifact, installation smoke, launch smoke, or OS keyring/credential-service round trip exists. |
| 2. | A user can authenticate and connect Gmail and Google Calendar. | **PARTIAL** | [`test/e2e/mail-search-to-draft.test.ts`](../../test/e2e/mail-search-to-draft.test.ts) and [`test/e2e/calendar-service-preview.test.ts`](../../test/e2e/calendar-service-preview.test.ts) cover local connector behavior. Live authorized Gmail and Google Calendar authentication/connection evidence through Vercel Connect is missing. |
| 3. | The Go Agent can complete a durable multi-step task, pause for user input, and resume after the app is closed. | **PARTIAL** | [`test/e2e/approval-resume.test.ts`](../../test/e2e/approval-resume.test.ts) and [`test/unit/agent-runtime.test.ts`](../../test/unit/agent-runtime.test.ts) cover the local durable-run and approval-resume seams. A live Eve durable-run trace and an installed-desktop close/reopen smoke on each supported OS are missing. |
| 4. | The writing editor supports correctness, tone, rewriting, composition, and full-document proofreading. | **PASS** | [`test/e2e/document-improvement.test.ts`](../../test/e2e/document-improvement.test.ts) exercises grouped clarity/tone suggestions, acceptance, rewriting, and editable versioned output; [`test/unit/evals.test.ts`](../../test/unit/evals.test.ts) records local writing-evaluation coverage. |
| 5. | Mail supports search, thread summary, draft generation, and event preview. | **PASS** | [`test/e2e/mail-search-to-draft.test.ts`](../../test/e2e/mail-search-to-draft.test.ts) covers search, summary, and draft generation; [`test/e2e/calendar-service-preview.test.ts`](../../test/e2e/calendar-service-preview.test.ts) covers event preview. These are local deterministic tests, not live-provider health evidence. |
| 6. | All sends, event creations, and consequential writes are approval-gated. | **PASS** | [`test/unit/mail-approval.test.ts`](../../test/unit/mail-approval.test.ts), [`test/unit/runtime-approval.test.ts`](../../test/unit/runtime-approval.test.ts), and [`test/redteam/unsafe-writes.test.ts`](../../test/redteam/unsafe-writes.test.ts) cover approval enforcement and unsafe-write rejection locally. |
| 7. | Docs support pages, attachments, local cache, version history, and basic sharing. | **PASS** | [`test/e2e/document-version-share.test.ts`](../../test/e2e/document-version-share.test.ts) covers document versioning and sharing; [`test/e2e/project-workspace.test.ts`](../../test/e2e/project-workspace.test.ts) uses fixture mail, calendar, file, and document sources. |
| 8. | Users can inspect and delete stored memory. | **PASS** | [`test/unit/memory-inspection.test.ts`](../../test/unit/memory-inspection.test.ts), [`test/unit/memory-panel.test.tsx`](../../test/unit/memory-panel.test.tsx), and [`test/unit/memory.test.ts`](../../test/unit/memory.test.ts) cover local memory inspection, controls, and deletion. |
| 9. | Every agent run exposes status, sources, tools, approvals, errors, and outputs. | **PASS** | [`test/e2e/email-to-work.test.ts`](../../test/e2e/email-to-work.test.ts), [`test/e2e/approval-resume.test.ts`](../../test/e2e/approval-resume.test.ts), and [`test/e2e/project-workspace.test.ts`](../../test/e2e/project-workspace.test.ts) cover local run timeline, source, approval, and grounded-output behavior. |
| 10. | Cross-workspace access tests show no unauthorized content leakage. | **PASS** | [`test/redteam/cross-workspace.test.ts`](../../test/redteam/cross-workspace.test.ts) is the local unauthorized-content-leakage test. |
| 11. | Connector tokens and secrets are absent from prompts, logs, telemetry, and memory. | **PASS** | [`test/redteam/secret-isolation.test.ts`](../../test/redteam/secret-isolation.test.ts) verifies the SEC-001 local red-team boundary. This does not prove live Vercel Connect token handling. |
| 12. | Critical workflows pass deterministic desktop and end-to-end tests. | **PARTIAL** | [`test/e2e/beta-readiness.test.ts`](../../test/e2e/beta-readiness.test.ts) requires 28/28 deterministic journey checks; [`test/e2e/platform-critical-flows.test.ts`](../../test/e2e/platform-critical-flows.test.ts) and [`test/unit/platform-matrix.test.ts`](../../test/unit/platform-matrix.test.ts) cover a deterministic Windows/macOS/Linux manifest. Native installer, package, keyring, and launched-app smoke evidence is still missing for all three operating systems. |
| 13. | Seven days of real writing, email, research, scheduling, and document tasks can be completed without maintaining a separate manual agent-tracking system. | **BLOCKED** | [`test/e2e/beta-readiness.test.ts`](../../test/e2e/beta-readiness.test.ts) intentionally reports `humanObservationPending: true`; [`docs/beta-readiness-3.12.md`](../beta-readiness-3.12.md) explicitly limits the seven labelled runs to deterministic fixtures. Seven consecutive calendar days of human observation, daily review, and a rollback drill remain pending. |

## Gate decisions and dependency disposition

| Item | Status | Disposition |
| --- | --- | --- |
| D1 — Product/module naming | **OPEN** | Product must choose and record product and module names. This blocks Gate 1 closure even where implementation evidence passes. |
| G1 — AI-view output schema | **CLOSED** | Retained closed status from [`spec/decision-gates.md`](../../spec/decision-gates.md). |
| G8 — Cross-surface approval UX | **CLOSED** | Retained closed status from [`spec/decision-gates.md`](../../spec/decision-gates.md). |
| G13 — Eve/AI SDK 7/Native SDK/Vercel Connect assumptions | **BLOCKED** | Local seams are not live-provider proof. Capture live Eve and AI SDK 7 traces, Vercel Connect managed-connection evidence, and native installer/package/keyring smoke evidence on Windows, macOS, and Linux. |

## Required closure evidence

1. Resolve D1 with a Product decision record.
2. Produce and retain Windows, macOS, and Linux native installer/package, launch, and OS keyring/credential-service smoke results.
3. Record authorized, live-provider evidence for Eve, AI SDK 7, and Vercel Connect under G13, including connection creation and credential isolation.
4. Complete seven consecutive calendar days of human beta observation across writing, email, research, scheduling, and documents; review support, telemetry, and reconciliation daily; and execute a rollback drill.
5. Replace every automated or placeholder approval with dated, named human sign-offs, including the placeholder approvals in [`docs/gates/gate-0-closure.md`](gate-0-closure.md).

## Required human sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Product | **PENDING — named human required** | Resolve D1 and approve MVP scope lock | — |
| Engineering Lead | **PENDING — named human required** | Accept native and G13 evidence | — |
| Client Engineering | **PENDING — named human required** | Accept three-platform installer/keyring smoke results | — |
| AI Engineering | **PENDING — named human required** | Accept live Eve and AI SDK 7 evidence | — |
| Integrations Engineering | **PENDING — named human required** | Accept live Vercel Connect evidence | — |
| Security | **PENDING — named human required** | Confirm live credential isolation evidence | — |
| Release Owner | **PENDING — named human required** | Confirm seven-day observation and rollback drill | — |

> Gate 0 still contains `OpenCode implementation session` placeholders and explicitly requires formal human sign-off before merge. Those placeholders are not named human sign-offs and cannot close Gate 1.

## Final disposition

**BLOCKED.** Criteria 1 and 13 are blocked; criteria 2, 3, and 12 are partial. D1 is open, G13 lacks live-provider and native proof, the human observation and rollback drill are pending, and named human sign-offs (including Gate 0 replacements) are pending. Deterministic fixtures must not be presented as live, native, or human evidence.
