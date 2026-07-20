# W9: Open Decisions — Technical-Assumption Validation

**Purpose:** Track validation of the technical-source assumptions in PRD §20. Entries are updated with implementation evidence, date, and links to the validating code or test.

**Last reviewed:** 2026-07-20

**Status definitions:**

- **Unvalidated:** No implementation evidence has been recorded.
- **Partial:** A subset of required capabilities is proven; remaining gaps are explicitly listed.
- **Validated:** All listed capabilities are proven in a representative implementation and documented with evidence.

## Vercel Eve

- **Assumption statement:** Vercel Eve supports the required agent structure, durable and resumable sessions, approval flows, and scheduled work.
- **Verification method:** Build a Phase 0 spike that defines instructions, tools, skills, and a subagent; execute a run through persistence and resume; require and resolve an approval; and trigger a scheduled run. Record SDK version, test output, and unresolved capability gaps.
- **Owner:** Engineering
- **Status:** Partial
- **Evidence:** [`src/agent/runtime.ts`](../../src/agent/runtime.ts) implements durable run records and persistent stores (`DurableRun`, `InMemoryRunStore`, and `NativeCacheRunStore`), explicit lifecycle states, pause/resume/retry/cancel transitions, checkpointing, partial output, and the approval-required/approve flow. [`test/unit/agent-runtime.test.ts`](../../test/unit/agent-runtime.test.ts) is the corresponding unit-test entry point. The agent tree also includes instructions, tools, a subagent, and a schedule definition under [`src/agent/`](../../src/agent/).
- **Blockers / remaining proof:** The implementation is a local runtime abstraction; it does not yet demonstrate a Vercel Eve SDK-backed run, an externally durable restart/resume, or execution of a scheduled run. Capture the Eve SDK version and an end-to-end persistence, approval, resume, and schedule trace before changing this to **Validated**.
- **Blocker escalation path:** Engineering → Architecture for integration or API-boundary issues → Product for scope or schedule impact. Escalate unresolved Phase 0 exit gaps through G13 in `spec/decision-gates.md`.

## AI SDK 7

- **Assumption statement:** AI SDK 7 supports streaming, structured output, tool calls, approvals, telemetry, and the required Eve integration boundary.
- **Verification method:** Build a representative AI workflow that streams output, validates a structured result, invokes a tool requiring approval, and emits telemetry. Capture provider configuration, SDK version, traces, and failure behavior.
- **Owner:** AI Engineering
- **Status:** Partial
- **Evidence:** The gateway routing, policy, and fallback boundary is implemented in [`src/core/gateway/router.ts`](../../src/core/gateway/router.ts), [`src/core/gateway/policy.ts`](../../src/core/gateway/policy.ts), and [`src/core/gateway/fallback.ts`](../../src/core/gateway/fallback.ts). [`test/unit/gateway.test.ts`](../../test/unit/gateway.test.ts) covers the gateway boundary and its mock-client path.
- **Blockers / remaining proof:** The recorded evidence does not establish an AI SDK 7 provider integration or prove streaming, structured output, tool invocation with approval, telemetry traces, and Eve-boundary failure behavior together. Add an AI SDK 7 integration test and trace evidence, including the installed SDK version, before marking **Validated**.
- **Blocker escalation path:** AI Engineering → Architecture for abstraction or compatibility issues → Product for capability trade-offs. Escalate unresolved Phase 0 exit gaps through G13 in `spec/decision-gates.md`.

## Native SDK

- **Assumption statement:** Native SDK supports native rendering, operating-system credential storage, packaging, and stable cross-platform desktop behavior for Creature.
- **Verification method:** Build a minimal native desktop shell that renders core UI, stores and retrieves a test credential through the operating-system credential service, packages for each supported desktop platform, and runs smoke tests on each target. Record versions, package artifacts, and platform-specific defects.
- **Owner:** Client Engineering
- **Status:** Partial
- **Evidence:** [`src/native/bridge.ts`](../../src/native/bridge.ts) selects the native library extension for Windows, macOS, and Linux and provides the native cache/queue boundary with encrypted fallback storage. [`src/desktop/main.ts`](../../src/desktop/main.ts) contains the desktop credential-service integration. Desktop coverage is present in [`test/unit/desktop.test.ts`](../../test/unit/desktop.test.ts) and [`test/eval/desktop.test.ts`](../../test/eval/desktop.test.ts).
- **Blockers / remaining proof:** No recorded package artifacts or smoke-test results prove native rendering, operating-system credential round trips, packaging, and stable behavior on every supported desktop platform. Run those checks on Windows, macOS, and Linux; attach artifacts and platform-specific results before marking **Validated**.
- **Blocker escalation path:** Client Engineering → Architecture for adapter or fallback design → Product for supported-platform scope. Escalate unresolved Phase 0 exit gaps through G13 in `spec/decision-gates.md`.

## Vercel Connect

- **Assumption statement:** Vercel Connect provides managed connectors and short-lived credentials for Creature’s supported external services.
- **Verification method:** Create a representative managed connection for each Phase 0 target service, verify that the agent receives only short-lived credentials, exercise token refresh and revocation, and document unsupported services or credential-exposure risks.
- **Owner:** Integrations Engineering
- **Status:** Partial
- **Evidence:** No implemented [`src/connectors/`](../../src/connectors/) contract-test surface was found in this review; therefore no Vercel Connect managed-connector or short-lived-credential behavior can be validated from the current codebase.
- **Blockers / remaining proof:** Implement connector contracts for each Phase 0 service and add tests proving managed connection creation, short-lived credential isolation, refresh, and revocation. Record unsupported providers and any credential-exposure risks. This is a G13 exit blocker until the contracts are implemented or Product approves a documented exception.
- **Blocker escalation path:** Integrations Engineering → Security for credential or isolation concerns → Architecture for connector-boundary alternatives → Product for provider-scope decisions. Escalate unresolved Phase 0 exit gaps through G13 in `spec/decision-gates.md`.

## Completion Criteria

G13 may be closed only when each assumption is marked **Validated** or has an approved, documented exception with an owner, mitigation, and decision-gate impact. See PRD §20 and [`spec/decision-gates.md`](../decision-gates.md).
