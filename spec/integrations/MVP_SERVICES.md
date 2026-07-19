# MVP Service Integration Plan

## Overview

These four services are being added now to make the Creature OS MVP operable and measurable from the first end-to-end agent run: Vercel AI Gateway supplies policy-controlled, resilient model access; Braintrust makes prompts, durable runs, and quality measurable; CircleCI enforces the PRD's automated quality gates across desktop platforms; and Vercel provides a repeatable build and preview surface plus the Vercel Connect connector boundary. Together, they preserve the PRD's provider-neutral AI layer, secure connector design, and evidence-based release process without placing those concerns in the Native SDK client or Eve domain tools.

| Service | PRD section(s) | MVP contribution |
| --- | --- | --- |
| Braintrust | §14.5, §15.3 | Automated evals, prompt versions, run traces, and quality-score reporting. |
| Vercel AI Gateway | §12.3, §19 D9 | Provider-neutral routing, fallback, policy enforcement, and spend visibility. |
| CircleCI | §14.5 | Cross-platform CI quality gates for the desktop application and agent stack. |
| Vercel | §12.4 | Build/preview pipeline and the Vercel Connect integration boundary. |

## Braintrust

- **Role:** Eval harness, prompt versioning, and durable-run tracing for Eve workflows.
- **Files to create/use:** `src/core/evals/braintrust.ts`, `test/eval/agent.test.ts`.
- **Dependencies:** `@braintrust/core` or `@braintrust/sdk`.
- **Environment variables:** `BRAINTRUST_API_KEY`, `BRAINTRUST_PROJECT_NAME`.
- **PRD mapping:** §14.5 (testing) and §15.3 (quality metrics).
- **Key functions:**
  - `initBraintrust()` initializes the remote client when configured, otherwise returns the local mock reporter.
  - `runEval(name, fn, dataset)` executes deterministic agent cases and emits score records.
  - `traceRun(runId, steps)` records durable Eve run steps, including pause, approval, retry, and completion events.
- **Implementation boundary:** Keep Braintrust behind `src/core/evals/braintrust.ts`; domain tools and agent definitions emit typed evaluation and trace events rather than importing the SDK directly.
- **Acceptance:** Evals run and report scores in mock mode when `BRAINTRUST_API_KEY` is absent; configured environments publish the equivalent results to the named project.

## Vercel AI Gateway

- **Role:** Provider routing, fallback, spend controls, and observability beneath the AI SDK 7 model/tool layer.
- **Files to create/use:** extend `src/core/gateway/router.ts`; add `src/core/gateway/policy.ts` and `src/core/gateway/fallback.ts`.
- **Dependencies:** `ai`, `@vercel/ai`, and the required provider packages.
- **Environment variables:** `VERCEL_AI_GATEWAY_URL` plus provider API keys.
- **PRD mapping:** §12.3 and §19 D9.
- **Key functions:**
  - `routeModel(taskClass, request)` applies the workspace and task-class model policy.
  - `createGatewayClient(config)` creates the provider-neutral gateway-backed client used by AI SDK 7.
  - The fallback chain retries an allowed alternate provider/model for retryable provider failures while preserving the request's policy and tracing metadata.
- **Routing policy:** Classification, extraction, rewriting, and summarization default to lower-cost approved models. Planning, synthesis, and high-impact drafts default to stronger approved models. The policy module owns allowlists, per-workspace limits, and the decision record; prompts must not contain provider credentials.
- **Acceptance:** Routine tasks route to cheaper models; high-reasoning tasks route to stronger models; and a retryable provider failure activates the configured fallback chain.

## CircleCI

- **Role:** CI/CD pipeline for required quality gates before merge or release.
- **File:** `.circleci/config.yml`.
- **Jobs:** `install`, `typecheck`, `test-unit`, `test-contract`, `test-eval`, `test-redteam`, and `build-desktop`.
- **Matrix:** Windows, macOS, and Linux for platform-relevant validation; platform-independent checks can run once and feed the platform build jobs through workflow dependencies and caches.
- **PRD mapping:** §14.5.
- **Pipeline shape:** Install dependencies first, run type checking and the unit/contract/eval/red-team suites, then build desktop artifacts only after required checks succeed. Eval jobs use mock mode by default so CI does not require a Braintrust secret.
- **Acceptance:** `circleci config validate` succeeds and the configuration defines every listed test job and the Windows/macOS/Linux matrix.

## Vercel

- **Role:** Build pipeline, preview deployments, and the Vercel Connect integration point.
- **File:** `vercel.json`.
- **PRD mapping:** §12.4.
- **Configuration contract:** `vercel.json` defines a build command (initially `npm run build`) and makes no credentials part of the build artifact. Preview and production environments receive their configuration through Vercel environment settings, with the names documented below.
- **Connector boundary:** Vercel Connect supplies managed connectors and short-lived, per-call credentials for Gmail, Calendar, and future integrations. Long-lived credentials are never exposed to Eve prompts, Braintrust traces, Mnemosyne, or the Native SDK process.
- **Acceptance:** `vercel.json` is valid JSON, defines the build command, and all required environment references are documented.

## Integration Diagram

```text
[Native SDK Desktop] <-> [Eve Runtime] <-> [AI SDK 7] <-> [Vercel AI Gateway] <-> [Providers]
                                    |
                                    v
                              [Braintrust] (evals + tracing)
                                    |
                                    v
                              [Mnemosyne] <-> [PostgreSQL / Object Storage / Search]
                                    |
                                    v
                              [Vercel Connect] <-> [Gmail / Calendar / etc.]
```

The horizontal path is the runtime inference path. The vertical path records run quality and retrieves policy-approved memory and connector context; it must retain the existing secret boundaries between the Native SDK, provider gateway, memory service, and connectors.

## Environment Variables

| Variable | Service | Required | Description |
| --- | --- | --- | --- |
| `BRAINTRUST_API_KEY` | Braintrust | Optional | Enables remote eval reporting, prompt versioning, and run tracing; absence selects mock mode. |
| `BRAINTRUST_PROJECT_NAME` | Braintrust | Optional | Braintrust project that receives remote eval and trace records; required when remote reporting is enabled. |
| `VERCEL_AI_GATEWAY_URL` | Vercel AI Gateway | Required | Gateway base URL used by the AI SDK client for routed model requests. |
| `OPENAI_API_KEY` | Vercel AI Gateway / provider | Optional | Credential for the enabled OpenAI fallback or direct provider route. |
| `ANTHROPIC_API_KEY` | Vercel AI Gateway / provider | Optional | Credential for the enabled Anthropic fallback or direct provider route. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Vercel AI Gateway / provider | Optional | Credential for the enabled Google fallback or direct provider route. |
| `VERCEL_CONNECT_CLIENT_ID` | Vercel / Vercel Connect | Required when connectors are enabled | OAuth client identifier for managed connector authorization. |
| `VERCEL_CONNECT_CLIENT_SECRET` | Vercel / Vercel Connect | Required when connectors are enabled | OAuth client secret; server-side only and never logged or included in prompts. |
| `VERCEL_CONNECT_REDIRECT_URI` | Vercel / Vercel Connect | Required when connectors are enabled | Registered OAuth callback URL for connector authorization. |
| `VERCEL` | Vercel | Optional | Vercel-provided runtime indicator; application code must not depend on it locally. |
| `VERCEL_ENV` | Vercel | Optional | Vercel-provided deployment environment (`development`, `preview`, or `production`) used to select non-secret runtime configuration. |

## Next Steps

1. Add the gateway policy, router extension, and fallback chain with unit tests for task-class routing and provider failure.
2. Implement the Braintrust adapter and mock reporter, then add deterministic agent eval cases in `test/eval/agent.test.ts`.
3. Add `vercel.json` and configure preview/production environment variables in the Vercel project.
4. Configure Vercel Connect OAuth applications and implement connector calls with scoped, short-lived credentials.
5. Add `.circleci/config.yml`, define the listed jobs and OS matrix, and validate it with `circleci config validate`.
6. Run the eval, contract, red-team, and desktop build gates before enabling production connector access.
