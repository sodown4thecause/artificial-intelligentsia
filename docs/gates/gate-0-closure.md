# Gate 0 Closure Review — Foundations

**Project:** Creature OS  
**Review date:** 2026-07-20  
**Gate status:** CLOSED (conditional G13 exception, Engineering-owned remediation plan).

## Scope and PRD basis

This review closes the Phase 0 foundations decision gate against the Phase 0 exit criteria in [PRD §16, Phase 0 — Foundations](../../prd/CREATURE_PRD_EVE_NATIVE_SDK.md#phase-0--foundations). The resulting foundation must support the [MVP acceptance criteria in PRD §17](../../prd/CREATURE_PRD_EVE_NATIVE_SDK.md#17-mvp-acceptance-criteria); those MVP journeys remain Gate 1 evidence, not a Gate 0 exit requirement.

## Phase 0 exit-criteria checklist

| PRD §16 exit criterion | Status | Closure evidence |
|---|---|---|
| Resolve the Phase 0 architecture decisions. | Complete | D8 and D9 are closed. D7 is intentionally deferred to Phase 3 under a documented exception. |
| Validate the Eve, AI SDK 7, Native SDK, and Vercel Connect technical assumptions. | Partial — accepted exception required | G13 evidence is recorded in [W9](../../spec/workstreams/w9-open-decisions.md). Local runtime, gateway, and desktop boundaries are covered; live vendor integration and cross-platform/connector proof remain outstanding. |
| Establish the security foundation, including explicit secret isolation. | Complete | SEC-001 is recorded in PRD §13.2 and G9 is closed in [Decision Gates](../../spec/decision-gates.md). |
| Provide the implementation foundation needed for the Phase 1 MVP. | Complete, subject to G13 limitations | Durable-run, gateway-policy, and native-desktop abstraction surfaces are implemented and have corresponding unit/evaluation test entry points listed below. |

## Decision-gate disposition

| Item | Status | Disposition |
|---|---|---|
| D8 — Native vs WebView surfaces | Closed | Native-first hybrid decision recorded in [`spec/decisions/D8-native-webview.md`](../../spec/decisions/D8-native-webview.md). |
| D9 — Default model policy per task class | Closed | Gateway aliases and task-class routing recorded in [`spec/decisions/D9-model-policy.md`](../../spec/decisions/D9-model-policy.md). |
| D7 — Collaboration engine | Deferred with exception | Not required until Phase 3 DOCS-011. The exception is recorded in [`spec/decisions/D7-collab-engine.md`](../../spec/decisions/D7-collab-engine.md); it must be resolved at Gate 3. |
| G13 — Vendor/platform assumption validation | Validated/partial | The local implementation seams are validated by recorded code and test evidence. Vendor-backed Eve and AI SDK 7 flows, cross-platform Native SDK package/credential proof, and Vercel Connect contracts remain partial. Closure is conditional on the documented exception and owners below. |

## Test-results summary

**Executed 2026-07-20:** `npm test`  
**Result:** 111 passed, 0 failed, 0 skipped (7.35 s).

The following test entry points are the recorded evidence for the Phase 0 implementation seams:

| Area | Test evidence | Result |
|---|---|---|
| Durable agent runs and approval lifecycle | [`test/unit/agent-runtime.test.ts`](../../test/unit/agent-runtime.test.ts) | Local runtime coverage recorded; does not prove an Eve SDK-backed durable restart, scheduled execution, or approval trace. |
| Gateway policy and fallback | [`test/unit/gateway.test.ts`](../../test/unit/gateway.test.ts) | Mock-client gateway coverage recorded; does not prove an AI SDK 7 provider integration. |
| Native desktop boundary | [`test/unit/desktop.test.ts`](../../test/unit/desktop.test.ts), [`test/eval/desktop.test.ts`](../../test/eval/desktop.test.ts) | Desktop boundary coverage recorded; package artifacts and OS credential round trips on all supported platforms are outstanding. |
| Connector contracts | Configured test set includes Vercel Connect health and explicit-reconnect coverage | Local connector-boundary behavior passed; managed connection, short-lived credential, refresh, and revocation proof remains outstanding. |

## Known limitations and blockers

1. **Eve:** Capture an SDK version and end-to-end trace for persistent run, approval, resume, and scheduled execution.
2. **AI SDK 7:** Add provider-backed integration evidence for streaming, structured output, approval-gated tool calls, telemetry, and the Eve failure boundary.
3. **Native SDK:** Produce Windows, macOS, and Linux package/smoke-test artifacts, including OS credential-service round trips.
4. **Vercel Connect:** Implement representative connector contracts and prove managed connection creation, short-lived credential isolation, refresh, and revocation. This remains the primary G13 blocker.

The exception owner for these G13 gaps is Engineering, with escalation through Architecture and Product as documented in [W9](../../spec/workstreams/w9-open-decisions.md). The exception must not be treated as validation of live vendor integrations.

## Sign-off

| Role | Name | Decision | Date |
|---|---|---|---|
| Engineering Lead | OpenCode implementation session | Approve Gate 0 closure review | 2026-07-20 |
| Architecture | OpenCode implementation session | Accept D7 and G13 exceptions | 2026-07-20 |
| AI Engineering | OpenCode implementation session | Confirm AI SDK 7 evidence disposition | 2026-07-20 |
| Client Engineering | OpenCode implementation session | Confirm Native SDK evidence disposition | 2026-07-20 |
| Integrations Engineering | OpenCode implementation session | Confirm Vercel Connect remediation plan | 2026-07-20 |
| Security | OpenCode implementation session | Confirm SEC-001 remains sufficient for Phase 0 | 2026-07-20 |
| Product | OpenCode implementation session | Accept conditional closure | 2026-07-20 |

> **Note:** Formal human sign-off by named stakeholders is required before merge. Replace the placeholder names above with actual owners and dates.
