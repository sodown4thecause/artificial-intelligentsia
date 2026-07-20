# D9 — Gateway model routing policy

**Status:** Accepted  
**Date:** 2026-07-20  
**Decision owner:** Creature OS architecture

## Context and problem statement

Creature uses AI SDK 7 as its provider-neutral model and tool interface and AI Gateway for routing, fallback, observability, and spend control. A single default model would either make high-volume routine work unnecessarily expensive or make consequential work unreliable. Provider-specific model names also change more frequently than product behavior should.

This decision establishes stable, gateway-owned model aliases and routes every model call by an explicit task class. A task class is supplied by trusted application code; user prompt text, model output, and connector metadata must not select a model or override policy. The gateway configuration pins each alias to an evaluated provider/model version and may be changed only after the required quality, safety, latency, and cost evaluations pass.

## Decision

The gateway exposes three model aliases. They are the only model identifiers application code may request:

| Alias | Capability tier | Intended use |
| --- | --- | --- |
| `creature-fast` | low-cost, low-latency, structured-output capable | routine bounded transformations and classification |
| `creature-strong` | high-reasoning, tool-capable | multi-step reasoning and source-grounded synthesis |
| `creature-premium` | highest evaluated drafting quality | externally consequential or otherwise high-impact drafting |

The configured primary and fallback models behind an alias must be from distinct providers where a qualified second provider is available. Model revisions are pinned, not floating aliases such as `latest`. A provider/model may be promoted to an alias only after it meets the alias evaluation suite for schema fidelity, grounding, safety, latency, and cost.

### Task classes and default routing

| Task class | Typical operations | Default alias | Maximum request shape | Tools | Escalation and implementation notes |
| --- | --- | --- | --- | --- | --- |
| `classification` | intent, priority, routing, label selection, spam/automation eligibility | `creature-fast` | 8,000 input tokens; 512 output tokens | No, except a gateway-owned retrieval preprocessor | Require a closed schema and confidence. Low confidence returns `needs-review`; it does not silently use a stronger model. |
| `rewrite_extraction_summarization` | grammar and tone rewrite, translation, entity/field extraction, concise summaries | `creature-fast` | 16,000 input tokens; 2,000 output tokens | No | Preserve source boundaries. Oversized source content is chunked by the caller and merged deterministically; it is not rerouted solely because it is large. |
| `planning_research_synthesis` | plans, investigations, multi-source synthesis, agent next-step selection | `creature-strong` | 64,000 input tokens; 6,000 output tokens | Yes, subject to existing approval and connector policies | Sources and tool results must be passed as attributable context. The model must distinguish evidence from inference. |
| `high_impact_drafting` | external-facing executive, customer, legal, policy, bulk-send, or materially consequential drafts | `creature-premium` | 64,000 input tokens; 8,000 output tokens | Read-only retrieval only | A draft remains a draft: sending, publishing, or changing data still requires the applicable approval. The user-facing UI must label the draft as high impact and show source/citation availability. |

`high_impact_drafting` is selected by the workflow or explicit user choice, not by a model. It is required for an external bulk communication, a legal/policy template, a public statement, or any workflow marked high impact by workspace policy. Workspace administrators may classify additional workflows as high impact, but may not downgrade a required classification.

## Fallback and allowlist rules

1. The application sends `taskClass`, requested alias, workspace/plan policy identifier, run identifier, and an idempotency key to the gateway. The gateway derives the effective alias from the task class; a conflicting requested alias is rejected and audited.
2. The effective model must be in the allowlist for the task class, workspace, plan, region, and rollout cohort. A deny-listed provider, model revision, or alias is unavailable immediately. Direct provider model IDs are rejected.
3. A fallback may occur only for a provider outage, transient 5xx response, connection failure, or a timeout before any response bytes or tool call are emitted. There is at most one retry on the primary and one fallback attempt on an alternate provider.
4. Fallback stays within the effective alias and preserves the same output schema, token limits, data residency, retention, and safety settings. It never silently upgrades or downgrades tiers. If no compliant fallback exists, the run fails with a retriable `model_unavailable` result.
5. Do not fallback for cancelled requests, authentication/configuration errors, policy or safety blocks, invalid structured output, exhausted budget, or after a tool call/stream has begun. These outcomes must be surfaced and audited rather than hidden by another model attempt.
6. `creature-premium` requires plan and workspace entitlement. If it is not allowed, high-impact work is queued for user/admin action; it does not fall back to `creature-strong` without an explicit workflow policy that permits that lower tier and records the downgrade.

## Spend guardrails

The following are engineering safety ceilings until product entitlement limits are finalized. A plan or workspace policy may lower them, never raise them without a reviewed configuration change.

| Control | Default ceiling | Enforcement |
| --- | --- | --- |
| Per `creature-fast` invocation | USD 0.02 estimated cost | Reject before dispatch when the gateway estimate exceeds the ceiling. |
| Per `creature-strong` invocation | USD 0.30 estimated cost | Reject before dispatch; reserve the estimated cost before the attempt. |
| Per `creature-premium` invocation | USD 1.50 estimated cost | Reject before dispatch; reserve the estimated cost before the attempt. |
| Ordinary agent run | USD 1.00 cumulative model cost | Stop scheduling additional model steps and return `budget_exhausted`. |
| High-impact agent run | USD 3.00 cumulative model cost | Same behavior; only eligible high-impact workflows may use this ceiling. |
| User daily model budget | USD 10.00 | At 80% notify the user/workspace; at 100% deny new model dispatches. |
| Workspace daily model budget | USD 50.00 | At 80% notify workspace administrators; at 100% deny new model dispatches. |

The gateway calculates the effective limit as the minimum of the applicable alias, run, user, workspace, plan, and provider limits. Reservations include possible fallback attempts; actual provider usage releases unused reservation. If pricing or token usage cannot be estimated, dispatch is denied rather than treated as zero cost. Budget denials never trigger a lower-quality automatic route.

## Consequences

- **Cost:** Most high-volume work uses the fast tier and bounded token budgets. Premium reasoning is reserved for consequential drafts, and reservations prevent retry/fallback loops from exceeding the run budget.
- **Latency:** Classification and routine text operations prioritize the fast tier. Planning and high-impact drafting may take longer; callers must stream progress where supported and show a pending state rather than substitute a weaker model.
- **Quality:** Strong and premium tiers are reserved for work where reasoning, grounding, or drafting quality matters most. Explicit schemas, confidence thresholds, source attribution, and no-silent-downgrade rules make failures reviewable.
- **Observability:** For every attempt, record task class, policy version, alias, resolved provider/model revision, allowlist decision, fallback reason, estimated/reserved/actual cost, token usage, latency, output-schema result, budget decision, run ID, and workspace/plan identifiers. Do not record prompts, connector tokens, API keys, or other secrets in telemetry.

## Implementation contract for `src/core/gateway`

The gateway policy must accept only the four task-class values in the routing table and resolve them to the aliases above. It must expose a versioned policy snapshot so an agent run records the policy used at dispatch. A policy change, model deny-list, or exhausted budget must produce a typed, auditable result rather than a provider-specific error. Tool approval, connector permissions, redaction, and secret isolation remain separate controls and apply before every provider attempt.

## References

- `prd/CREATURE_PRD_EVE_NATIVE_SDK.md` §12.3 — AI SDK 7 and AI Gateway responsibilities and default routing principle.
- `prd/CREATURE_PRD_EVE_NATIVE_SDK.md` §19 D9 — architecture-blocking decision on the default model for each task class.
- `prd/CREATURE_PRD_EVE_NATIVE_SDK.md` §15.5 — cost-per-completed-workflow metric and cost allocation note.
