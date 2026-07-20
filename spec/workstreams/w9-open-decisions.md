# W9: Open Decisions — Technical-Assumption Validation

**Purpose:** Track validation of the technical-source assumptions in PRD §20. All entries begin as unvalidated and must be updated with evidence, date, and links to the validating spike or test.

**Status definitions:**

- **Unvalidated:** No implementation evidence has been recorded.
- **Partial:** A subset of required capabilities is proven; remaining gaps are explicitly listed.
- **Validated:** All listed capabilities are proven in a representative implementation and documented with evidence.

## Vercel Eve

- **Assumption statement:** Vercel Eve supports the required agent structure, durable and resumable sessions, approval flows, and scheduled work.
- **Verification method:** Build a Phase 0 spike that defines instructions, tools, skills, and a subagent; execute a run through persistence and resume; require and resolve an approval; and trigger a scheduled run. Record SDK version, test output, and unresolved capability gaps.
- **Owner:** Engineering
- **Status:** Unvalidated
- **Blocker escalation path:** Engineering → Architecture for integration or API-boundary issues → Product for scope or schedule impact. Escalate unresolved Phase 0 exit gaps through G13 in `spec/decision-gates.md`.

## AI SDK 7

- **Assumption statement:** AI SDK 7 supports streaming, structured output, tool calls, approvals, telemetry, and the required Eve integration boundary.
- **Verification method:** Build a representative AI workflow that streams output, validates a structured result, invokes a tool requiring approval, and emits telemetry. Capture provider configuration, SDK version, traces, and failure behavior.
- **Owner:** AI Engineering
- **Status:** Unvalidated
- **Blocker escalation path:** AI Engineering → Architecture for abstraction or compatibility issues → Product for capability trade-offs. Escalate unresolved Phase 0 exit gaps through G13 in `spec/decision-gates.md`.

## Native SDK

- **Assumption statement:** Native SDK supports native rendering, operating-system credential storage, packaging, and stable cross-platform desktop behavior for Creature.
- **Verification method:** Build a minimal native desktop shell that renders core UI, stores and retrieves a test credential through the operating-system credential service, packages for each supported desktop platform, and runs smoke tests on each target. Record versions, package artifacts, and platform-specific defects.
- **Owner:** Client Engineering
- **Status:** Unvalidated
- **Blocker escalation path:** Client Engineering → Architecture for adapter or fallback design → Product for supported-platform scope. Escalate unresolved Phase 0 exit gaps through G13 in `spec/decision-gates.md`.

## Vercel Connect

- **Assumption statement:** Vercel Connect provides managed connectors and short-lived credentials for Creature’s supported external services.
- **Verification method:** Create a representative managed connection for each Phase 0 target service, verify that the agent receives only short-lived credentials, exercise token refresh and revocation, and document unsupported services or credential-exposure risks.
- **Owner:** Integrations Engineering
- **Status:** Unvalidated
- **Blocker escalation path:** Integrations Engineering → Security for credential or isolation concerns → Architecture for connector-boundary alternatives → Product for provider-scope decisions. Escalate unresolved Phase 0 exit gaps through G13 in `spec/decision-gates.md`.

## Completion Criteria

G13 may be closed only when each assumption is marked **Validated** or has an approved, documented exception with an owner, mitigation, and decision-gate impact. See PRD §20 and [`spec/decision-gates.md`](../decision-gates.md).
