# Plan: Service Integration + CI/CD Skeletons + PRs

**Goal:** Create the service integration plan, implement Braintrust / Vercel AI Gateway / CircleCI / Vercel skeletons, and open all PRs together.

**Scope:** Phase 0 + Phase 1 MVP production readiness.

**Current state:**
- `prd/PRODUCTION_READINESS_MVP.md` exists (created, 468 lines, 60 checklist items) but not committed
- 3 existing PRs are open from prior work:
  - PR #1: PRD revision (`prd-revision` branch)
  - PR #2: spec gap closures (`spec-gap-closures` branch)
  - PR #3: FR catalog sync (`spec-fr-catalog` branch)
- Workspace is on `spec-fr-catalog` branch
- Codebase has no Braintrust, Vercel AI Gateway, CircleCI, or Vercel integration

**Decision:** User selected option B — continue with service integration plan + skeleton code, then open all PRs together.

---

## Phase 1: Service Integration Plan Document (1 agent)

**Deliverable:** `spec/integrations/MVP_SERVICES.md`

**Content:**
1. **Overview** — which services are used for what
2. **Braintrust**
   - Role: eval harness, prompt versioning, durable-run tracing
   - Files: `src/core/evals/braintrust.ts`, `test/eval/agent.test.ts`
   - Env vars: `BRAINTRUST_API_KEY`, `BRAINTRUST_PROJECT_NAME`
   - PRD mapping: §14.5 agent evals, §15.3 quality metrics
3. **Vercel AI Gateway**
   - Role: provider routing, fallback, spend controls, observability
   - Files: `src/core/gateway/router.ts`, `src/core/gateway/policy.ts`, `src/core/gateway/fallback.ts`
   - Env vars: `VERCEL_AI_GATEWAY_URL`, provider keys
   - PRD mapping: §12.3, §19 D9
4. **CircleCI**
   - Role: CI/CD pipeline
   - File: `.circleci/config.yml`
   - Jobs: install, typecheck, lint, unit tests, contract tests, eval tests, red-team tests, build desktop artifacts
   - Matrix: Windows, macOS, Linux runners
   - PRD mapping: §14.5 testing
5. **Vercel**
   - Role: build pipeline / preview deployments / Vercel Connect
   - File: `vercel.json`
   - PRD mapping: §12.4 Vercel Connect
6. **Integration diagram** — text diagram showing data flow
7. **Environment variable summary table**

**Verification:** Document references every service to specific PRD sections and files.

---

## Phase 2: Braintrust Skeleton (1 agent)

**Deliverables:**
1. Add dependency: `@braintrust/core` or `@braintrust/sdk` to `package.json`
2. Create `src/core/evals/braintrust.ts`
   - `initBraintrust()` — initialize with API key and project
   - `runEval(name, fn, dataset)` — generic eval runner
   - `traceRun(runId, steps)` — trace durable run steps
3. Update `test/eval/agent.test.ts` to use the Braintrust wrapper
4. Add `.env.example` with `BRAINTRUST_API_KEY` and `BRAINTRUST_PROJECT_NAME`

**Verification:**
- `npm install` succeeds
- `npm run test:eval` runs (may skip if no API key, but structure is correct)
- `npm run typecheck` passes

---

## Phase 3: Vercel AI Gateway Skeleton (1 agent)

**Deliverables:**
1. Add dependencies: `ai`, `@vercel/ai`, and any provider packages (e.g., `@ai-sdk/openai`)
2. Rewrite/extend `src/core/gateway/router.ts`
   - `routeModel(taskClass, request)` — route by task class
   - `createGatewayClient(config)` — create AI SDK client pointing to AI Gateway
3. Create `src/core/gateway/policy.ts`
   - Default model policy table (routine → cheaper model, planning/synthesis → stronger model)
   - Per-plan policy overrides
4. Create `src/core/gateway/fallback.ts`
   - Provider failure detection
   - Fallback chain
5. Update `.env.example` with `VERCEL_AI_GATEWAY_URL`

**Verification:**
- `npm install` succeeds
- `npm run typecheck` passes
- Gateway router has no runtime errors when imported

---

## Phase 4: CircleCI + Vercel Config (1 agent)

**Deliverables:**
1. Create `.circleci/config.yml`
   - `install` job
   - `typecheck` job
   - `test-unit` job
   - `test-contract` job
   - `test-eval` job
   - `test-redteam` job
   - `build-desktop` job (matrix: win, mac, linux)
   - `workflows` section to orchestrate jobs
2. Create `vercel.json`
   - Build command
   - Output directory
   - Framework detection settings
   - Environment variable references
3. Update `package.json` scripts if needed (e.g., add `lint` if missing)
4. Add `.env.example` entries for Vercel/CircleCI if needed

**Verification:**
- `.circleci/config.yml` is valid YAML
- `circleci config validate` passes (if CircleCI CLI available)
- `vercel.json` is valid JSON
- `npm run typecheck` passes

---

## Phase 5: Bundle All Work into Branches + Open PRs (1 agent)

**Branch strategy:** Create 4 new branches from `main` and commit the relevant files to each.

### Branch 1: `docs/production-readiness-mvp`
**Files:**
- `prd/PRODUCTION_READINESS_MVP.md`

**Commit:** `docs: add production readiness checklist for Phase 0 + Phase 1 MVP`

### Branch 2: `docs/mvp-services-integration`
**Files:**
- `spec/integrations/MVP_SERVICES.md`

**Commit:** `docs: add MVP service integration plan`

### Branch 3: `feat/braintrust-ai-gateway-skeletons`
**Files:**
- `src/core/evals/braintrust.ts`
- `src/core/gateway/router.ts`
- `src/core/gateway/policy.ts`
- `src/core/gateway/fallback.ts`
- `test/eval/agent.test.ts`
- `package.json`
- `package-lock.json` or `pnpm-lock.yaml`
- `.env.example`

**Commit:** `feat: add Braintrust and Vercel AI Gateway skeletons`

### Branch 4: `chore/circleci-vercel-config`
**Files:**
- `.circleci/config.yml`
- `vercel.json`
- `.env.example` (if updated)

**Commit:** `chore: add CircleCI and Vercel configuration`

### PRs to open
1. `docs/production-readiness-mvp` → `main`
2. `docs/mvp-services-integration` → `main`
3. `feat/braintrust-ai-gateway-skeletons` → `main`
4. `chore/circleci-vercel-config` → `main`

**Verification:**
- All 4 branches pushed to origin
- All 4 PRs have clear titles and descriptions
- `npm run typecheck` passes on the feature branch

---

## Stopping Condition

- `prd/PRODUCTION_READINESS_MVP.md` is in a PR
- `spec/integrations/MVP_SERVICES.md` is in a PR
- Braintrust + AI Gateway skeleton code is in a PR
- CircleCI + Vercel config is in a PR
- All PRs pass typecheck

---

## Agent Orchestration

- **Phase 1:** @medium (gpt-5.6-terra) — service integration plan document
- **Phase 2:** @medium — Braintrust skeleton
- **Phase 3:** @medium — AI Gateway skeleton
- **Phase 4:** @medium — CircleCI + Vercel config
- **Phase 5:** @medium — branch bundling + PR creation

Phases 2, 3, and 4 can run in parallel after Phase 1. Phase 5 depends on all previous phases.
