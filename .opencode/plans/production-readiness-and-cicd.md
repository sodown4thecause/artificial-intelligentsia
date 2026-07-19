# Plan: Production Readiness Checklist + CI/CD + Service Integration

**Goal:** Create `prd/PRODUCTION_READINESS_MVP.md` covering everything needed to ship Creature OS Phase 0 + Phase 1 MVP to production, then commit the work via PRs and set up CircleCI + Vercel build pipeline with Braintrust and Vercel AI Gateway integration.

**Scope:** Phase 0 (Foundations) + Phase 1 (Personal MVP) only.

**Current state:**
- PRD exists on `prd-revision` branch as Revised Draft 1.1
- Workspace is on `spec-fr-catalog` branch
- Codebase is ~30% complete; code skeleton exists but not integrated with Vercel Eve, AI SDK 7, Native SDK, Vercel Connect, or Mnemosyne
- 3 PRs already open for PRD revision, spec closures, and FR catalog sync
- No CI/CD configured
- No Braintrust, Vercel AI Gateway, or CircleCI integration yet

**Services user is adding:**
- Braintrust (evals, tracing, prompt management)
- Vercel AI Gateway (model routing, fallbacks, observability, spend controls)
- CircleCI (CI/CD pipeline)
- Vercel (build pipeline / previews / deployment orchestration)

---

## Phase 1: Create Production Readiness Checklist (1 agent)

**Deliverable:** `prd/PRODUCTION_READINESS_MVP.md`

**Content structure:**
1. **Executive summary** — what MVP production-ready means
2. **Phase 0 Foundations checklist**
   - Native SDK desktop shell (Win/Mac/Linux)
   - Authentication + workspace selection
   - Vercel Eve agent scaffold (agents, tools, skills, durable sessions)
   - AI SDK 7 + AI Gateway integration
   - Mnemosyne memory boundary
   - Local cache + offline queues
   - Run timeline + approval UI
   - Permission + audit model
   - Telemetry + eval harness
3. **Phase 1 MVP checklist**
   - Go Agent chat + task inbox
   - Doc editor + writing core (WRITE-001..009)
   - Gmail read/search/summarize/draft
   - Google Calendar read + event preview
   - Basic Docs (pages/attachments/version/share)
   - Memory controls
   - Manual connectors
4. **Security & compliance checklist**
   - SEC-001 enforcement
   - OS credential storage
   - Secret isolation in prompts/logs/telemetry/memory
   - Audit logging
   - Permission classes + approval gates
   - Red-team test suite passing
5. **Observability checklist**
   - Braintrust evals integration
   - Vercel AI Gateway routing/fallback/spend controls
   - Telemetry for agent runs, model/tool/connector latency
   - Error tracking
6. **Testing checklist**
   - Unit tests for business rules + permission checks
   - Contract tests for connectors
   - Deterministic Native SDK UI tests
   - E2E tests for mail/docs/approval/automation flows
   - Agent evals for drafting/summarization/grounding/planning
   - Red-team tests for prompt injection/data exfil/unsafe writes/cross-workspace access
7. **CI/CD checklist**
   - CircleCI config
   - Vercel build pipeline
   - Type checking
   - Linting
   - Test matrix across platforms
   - Artifact builds for desktop
8. **Data & storage checklist**
   - PostgreSQL schema
   - Object storage
   - Search index
   - Local encrypted DB
   - Backup/retention
9. **Launch readiness**
   - Reference environments
   - Rollback plan
   - On-call runbook
   - Feature flags

**Verification:** Checklist covers every Phase 0/1 exit criterion from PRD §16 and §17.

---

## Phase 2: Commit Checklist to GitHub (1 agent)

**Task:** Create a branch from `main`, add the new checklist file, commit, push, open PR.

**Branch:** `docs/production-readiness-mvp`
**PR title:** `docs: add production readiness checklist for Phase 0 + Phase 1 MVP`
**PR body:** Summary of checklist sections and how they map to PRD §16/§17 exit criteria.

**Verification:** PR is open and linked in final summary.

---

## Phase 3: Service Integration Plan (1 agent)

**Deliverable:** Update `spec/workstreams/w3-architecture-map.md` or create `spec/integrations/braintrust-ai-gateway-circleci.md` documenting how each service fits.

**Content:**
1. **Braintrust**
   - Use for agent evals (test/eval/agent.test.ts → Braintrust eval harness)
   - Use for prompt versioning/management
   - Use for tracing durable runs
   - Required env vars / API keys
2. **Vercel AI Gateway**
   - Replace/extend `src/core/gateway/router.ts`
   - Configure provider routing, model fallback, spend controls
   - Route routine classification/rewrite/summarize to cheaper models
   - Reserve strong models for planning/synthesis/high-impact drafts
3. **CircleCI**
   - `.circleci/config.yml`
   - Jobs: install, typecheck, test (unit/contract/eval/red-team), build desktop artifacts
   - Matrix: Windows, macOS, Linux
   - Store artifacts and test results
4. **Vercel**
   - Build pipeline / preview deployments
   - Possibly deploy web companion or docs site
   - Vercel Connect for managed connectors

**Verification:** Document clearly maps each service to PRD requirements.

---

## Phase 4: Implement Service Skeletons (2-3 agents)

**Task:** Add minimal integration code for the three services.

### 4.1 Braintrust integration
- Add `@braintrust/core` or `@braintrust/sdk` dependency
- Create `src/core/evals/braintrust.ts` wrapper
- Wire `test/eval/agent.test.ts` to use Braintrust eval harness

### 4.2 Vercel AI Gateway integration
- Add `@vercel/ai` and AI Gateway config
- Rewrite/extend `src/core/gateway/router.ts` to use AI Gateway
- Add `src/core/gateway/policy.ts` for per-task model routing
- Add `src/core/gateway/fallback.ts` for provider fallback

### 4.3 CircleCI + Vercel config
- Create `.circleci/config.yml`
- Create `vercel.json` or `apps/desktop/vercel.json` for build pipeline
- Add GitHub Actions if needed for Vercel preview deployments

**Verification:**
- `npm run typecheck` passes
- `npm run test:unit` passes
- CircleCI config validates (`circleci config validate`)
- Vercel config is valid JSON

---

## Phase 5: Open PRs (1 agent)

**PRs to open:**
1. `docs/production-readiness-mvp` → `main`
2. `docs/service-integration-plan` → `main`
3. `feat/braintrust-integration` → `main`
4. `feat/ai-gateway-integration` → `main`
5. `chore/circleci-vercel-config` → `main`

**Verification:** All PRs have clear descriptions and pass CI checks.

---

## Stopping Condition

- `prd/PRODUCTION_READINESS_MVP.md` exists and covers Phase 0 + Phase 1 MVP
- Service integration document exists
- Braintrust, AI Gateway, CircleCI, Vercel skeletons are in the repo
- All changes are in PRs against `main`

---

## Agent Orchestration Notes

- **Phase 1:** @medium (gpt-5.6-terra) — checklist creation
- **Phase 2:** @medium — commit + PR
- **Phase 3:** @medium — service integration plan
- **Phase 4:** @medium (3 parallel agents) — service skeletons
- **Phase 5:** @medium — PR creation
