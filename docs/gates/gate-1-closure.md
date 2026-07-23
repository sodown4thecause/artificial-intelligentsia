# Gate 1 Closure Assessment — MVP Scope Lock

**Project:** Creature OS  
**Review date:** 2026-07-22
**Gate status: BLOCKED.** Gate 1 is **OPEN** in the decision tracker until its blockers are resolved and named humans sign the record.

## Native shell increment — 2026-07-23

The isolated `apps/desktop-native/` shell uses the official Vercel Native SDK CLI pinned to `@native-sdk/cli` **0.5.4**. It is a TypeScript model/update core plus `.native` markup, with the SDK's D8 adapter/build boundary; it does not embed the existing Node/React application. Native SDK v0.5.4 requires its `gpu_surface` canvas renderer for this markup; that renderer is not a WebView and the shell declares no web, network, filesystem, shell, or credentials permission. Its Windows directory package and launch smoke are one local incremental package/launch result only. They do **not** close Gate 1 and do not establish an installer, signing, OS-keyring handling, macOS/Linux packaging, or live Go Agent integration.

Local Windows-only evidence on 2026-07-23: `native check`, `native build`, and `native package --target windows` produced a fresh `apps/desktop-native/package/windows/bin/creature-os-go-agent.exe` with its exact SHA-256 recorded. The local CLI version was observed as 0.5.4; the smoke requires a responsive top-level window titled exactly `Creature OS - Go Agent` and bounded process-tree cleanup, then records ignored local JSON evidence. This is not installed-app, human-interaction, installer, signing, keyring, live-service, macOS/Linux, or sign-off evidence.

## Scope and evidence rules

This assessment evaluates the 13 private-beta conditions in [PRD §17](../../prd/CREATURE_PRD_EVE_NATIVE_SDK.md#17-mvp-acceptance-criteria) against `main` after [PR #30](https://github.com/sodown4thecause/artificial-intelligentsia/pull/30) ([`ec9139a`](https://github.com/sodown4thecause/artificial-intelligentsia/commit/ec9139a)) and [PR #31](https://github.com/sodown4thecause/artificial-intelligentsia/pull/31) ([`f3af0d2`](https://github.com/sodown4thecause/artificial-intelligentsia/commit/f3af0d2)). Local tests and deterministic fixtures are evidence of implementation behavior only. They are **not** evidence that native installers work, that authorized people used live providers, or that humans observed the product for seven calendar days.

`npm test` was recorded as passing 111 tests in the Gate 0 closure record before PR #27. PR #27 added deterministic platform-flow manifest coverage; this review must be re-verified after the record and evaluation test are merged.

## PRD §17 criterion-by-criterion assessment

| # | PRD §17 criterion | Status | Exact local evidence and remaining limitation |
| --- | --- | --- | --- |
| 1. | The native desktop app installs and launches on supported Windows, macOS, and Linux reference environments. | **BLOCKED** | Native-library compilation, native build tests, smoke checks, checksums, evidence JSON, and retention pass in the recorded CI matrix below. No Windows/MSI, macOS/package, or Linux/package installer artifact, installation smoke, launch smoke, or OS keyring/credential-service round trip exists. |
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
| 12. | Critical workflows pass deterministic desktop and end-to-end tests. | **PARTIAL** | [`test/e2e/beta-readiness.test.ts`](../../test/e2e/beta-readiness.test.ts) requires 28/28 deterministic journey checks; the recorded CI native-library matrix also passes on Windows, macOS, and Linux. Native installer/package, installation, launch, and OS-keyring smoke evidence is still missing for all three operating systems. |
| 13. | Seven days of real writing, email, research, scheduling, and document tasks can be completed without maintaining a separate manual agent-tracking system. | **BLOCKED** | [`test/e2e/beta-readiness.test.ts`](../../test/e2e/beta-readiness.test.ts) intentionally reports `humanObservationPending: true`; [`docs/beta-readiness-3.12.md`](../beta-readiness-3.12.md) explicitly limits the seven labelled runs to deterministic fixtures. Seven consecutive calendar days of human observation, daily review, and a rollback drill remain pending. |

## Gate decisions and dependency disposition

| Item | Status | Disposition |
| --- | --- | --- |
| D1 — Product/module naming | **CLOSED** | [`D1-product-module-names.md`](../../spec/decisions/D1-product-module-names.md) locks **Creature OS** and **Go Agent**. |
| G1 — AI-view output schema | **CLOSED** | Retained closed status from [`spec/decision-gates.md`](../../spec/decision-gates.md). |
| G8 — Cross-surface approval UX | **CLOSED** | Retained closed status from [`spec/decision-gates.md`](../../spec/decision-gates.md). |
| G13 — Eve/AI SDK 7/Native SDK/Vercel Connect assumptions | **BLOCKED** | Local seams are not live-provider proof. Capture live Eve and AI SDK 7 traces, Vercel Connect managed-connection evidence, and native installer/package, installation, launch, and OS-keyring smoke evidence on Windows, macOS, and Linux. |

## Required closure evidence

1. Produce and retain Windows, macOS, and Linux native installer/package, installation, launch, and OS keyring/credential-service smoke results.
2. Record authorized, live-provider evidence for Eve, AI SDK 7, and Vercel Connect under G13, including connection creation and credential isolation.
3. Complete seven consecutive calendar days of human beta observation across writing, email, research, scheduling, and documents; review support, telemetry, and reconciliation daily; and execute a rollback drill.
4. Replace every automated or placeholder approval with dated, named human sign-offs, including the placeholder approvals in [`docs/gates/gate-0-closure.md`](gate-0-closure.md).

## Required human sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Product | **PENDING — named human required** | Approve MVP scope lock | — |
| Engineering Lead | **PENDING — named human required** | Accept native and G13 evidence | — |
| Client Engineering | **PENDING — named human required** | Accept three-platform installer/keyring smoke results | — |
| AI Engineering | **PENDING — named human required** | Accept live Eve and AI SDK 7 evidence | — |
| Integrations Engineering | **PENDING — named human required** | Accept live Vercel Connect evidence | — |
| Security | **PENDING — named human required** | Confirm live credential isolation evidence | — |
| Release Owner | **PENDING — named human required** | Confirm seven-day observation and rollback drill | — |

> Gate 0 still contains `OpenCode implementation session` placeholders and explicitly requires formal human sign-off before merge. Those placeholders are not named human sign-offs and cannot close Gate 1.

## Final disposition

**BLOCKED.** Criteria 1 and 13 are blocked; criteria 2, 3, and 12 are partial. D1 is closed, but G13 lacks live-provider evidence; installer/package, installation, launch, OS-keyring, and signing/notarization evidence remains blocked; the human observation and rollback drill are pending; and named human sign-offs (including Gate 0 replacements) are pending. Deterministic fixtures must not be presented as live, native, or human evidence.

## Native CI and release evidence — 2026-07-22

| Evidence | Status | Record |
| --- | --- | --- |
| Native-library compilation, native build tests, smoke checks, checksums, evidence JSON, and retention | **PASS** | [CircleCI workflow](https://app.circleci.com/workflow/67015e34-5490-4e31-9520-3e90477a2bd8): [macOS job 142](https://circleci.com/gh/sodown4thecause/artificial-intelligentsia/142), [Windows job 143](https://circleci.com/gh/sodown4thecause/artificial-intelligentsia/143), [Linux job 144](https://circleci.com/gh/sodown4thecause/artificial-intelligentsia/144), and [artifact publication job 145](https://circleci.com/gh/sodown4thecause/artificial-intelligentsia/145). |
| Published native-library archives | **PASS** | [`v0.1.0` prerelease](https://github.com/sodown4thecause/artificial-intelligentsia/releases/tag/v0.1.0) publishes platform native-library archives; [PR #31](https://github.com/sodown4thecause/artificial-intelligentsia/pull/31) (`f3af0d2`) added the README and release links. |
| Installer/package, installation, launched desktop, OS keyring, and signing/notarization | **BLOCKED** | The published artifacts are native libraries/developer artifacts only, not installers or runnable desktop packages. |
# Windows package evidence clarification

The Windows evidence is a **local directory package** and an automated packaged-window readiness smoke only. A PASS proves that a freshly generated `bin/creature-os-go-agent.exe` opened a responsive `Creature OS - Go Agent` top-level window; it is not human interactive UI validation or an installed-application launch.

This does not close Gate 1 or the Windows installer criterion. An installer, installation evidence, signing, production keyring validation, and human interactive launch validation remain outstanding.
