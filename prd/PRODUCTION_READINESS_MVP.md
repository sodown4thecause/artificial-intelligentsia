# Creature OS — Production Readiness Checklist (Phase 0 + Phase 1 MVP)

**Scope:** Phase 0 Foundations and Phase 1 Personal MVP only.
**Target platforms:** Windows, macOS, Linux.
**Primary stack:** Vercel Eve, Vercel AI SDK 7, Vercel AI Gateway, Vercel Connect, Native SDK, Mnemosyne.
**Services being added:** Braintrust (evals/tracing), Vercel AI Gateway (routing), CircleCI (CI/CD), Vercel (build pipeline).

## 1. Phase 0 — Foundations

### 1.1 Native SDK desktop shell

- [ ] **P0-01:** Ship the Native SDK desktop shell for Windows, macOS, and Linux.
  - **PRD reference:** §12.1, §16, §17.1
  - **Acceptance:** Signed/installable reference-environment builds launch, navigate, and close cleanly on all three platforms.
  - **Owner:** eng
  - **Notes:** Keep Native SDK behind UI/service adapters; pin and validate SDK versions.
- [ ] **P0-02:** Meet the desktop cold-start performance target.
  - **PRD reference:** §14.1
  - **Acceptance:** Post-warm-up cold start is under two seconds on each documented reference hardware profile.
  - **Owner:** eng
  - **Notes:** Record methodology and percentile samples in the performance baseline.

### 1.2 Authentication & workspace selection

- [ ] **P0-03:** Implement authentication and workspace selection.
  - **PRD reference:** §16, §17.2
  - **Acceptance:** A user can sign in, select an authorized workspace, sign out, and cannot load another workspace's data.
  - **Owner:** eng
  - **Notes:** Workspace identity must be propagated to every service, connector, memory, and search request.

### 1.3 Vercel Eve agent scaffold

- [ ] **P0-04:** Build the Eve durable-session scaffold with lifecycle states and checkpoints.
  - **PRD reference:** GO-002, §12.2, §16, §17.3
  - **Acceptance:** A multi-step mock task can start, survive app closure, reopen in queued/running/waiting state, and resume from its latest checkpoint.
  - **Owner:** eng
  - **Notes:** Isolate Eve registration from domain tools and pin framework upgrades.
- [ ] **P0-05:** Implement the run timeline and approval UI primitive.
  - **PRD reference:** §7.2, GO-005, §16, §17.9
  - **Acceptance:** Each run displays status, plan/stages, sources, tools, pending approvals, errors, retries, outputs, and permits approval-driven resume.
  - **Owner:** ux
  - **Notes:** Cross-surface approvals must show originating context in the native action surface.

### 1.4 AI SDK 7 + AI Gateway integration

- [ ] **P0-06:** Integrate AI SDK 7 with AI Gateway routing, structured tools, and streaming.
  - **PRD reference:** §12.3, §16
  - **Acceptance:** A test agent streams output, invokes an approved tool through AI SDK 7, and records model/tool lifecycle events.
  - **Owner:** eng
  - **Notes:** Keep application tools provider-neutral.
- [ ] **P0-07:** Define and test model routing, fallback, and per-plan policy.
  - **PRD reference:** §12.3, §19 D9
  - **Acceptance:** Routine and high-reasoning task classes route to approved models; a provider failure falls back safely; spend limits prevent over-budget runs.
  - **Owner:** eng
  - **Notes:** D9 is architecture-blocking and must be recorded as resolved before Phase 0 completion.

### 1.5 Mnemosyne memory boundary

- [ ] **P0-08:** Enforce Mnemosyne as the sole durable-memory boundary.
  - **PRD reference:** MEM-001, MEM-004, §12.5, §16
  - **Acceptance:** Eve retrieves scoped memory only through Mnemosyne; canonical mail, documents, records, approvals, audit logs, Git history, and credentials are never substituted by memory.
  - **Owner:** eng
  - **Notes:** Prohibit hidden agent memory stores and attach provenance, purpose, and retention metadata.
- [ ] **P0-09:** Add memory candidate filtering and secret isolation.
  - **PRD reference:** MEM-005, §12.5, SEC-001
  - **Acceptance:** Candidate extraction filters sensitive material, deduplicates/conflict-checks, and requires required user or policy approval before write.
  - **Owner:** security
  - **Notes:** Secret scanning must run before memory persistence and redaction before any telemetry persistence.

### 1.6 Local cache & offline queues

- [ ] **P0-10:** Implement the encrypted local cache and offline-operation queue.
  - **PRD reference:** §12.1, §12.6, §14.1, §16
  - **Acceptance:** Cached ordinary documents open offline in under 500 ms; queued operations synchronize safely after reconnect without duplicate writes.
  - **Owner:** eng
  - **Notes:** Cache only permitted data; conflict, retry, expiry, and user-visible recovery behavior are required.

### 1.7 Run timeline & approval UI

- [ ] **P0-11:** Validate risky-tool pause, approval, and resume behavior end to end.
  - **PRD reference:** GO-002, GO-005, §16
  - **Acceptance:** A risky mock tool pauses before execution, approval is surfaced in the task inbox/timeline, and the exact run resumes once without duplicate impact.
  - **Owner:** eng
  - **Notes:** This is the explicit Phase 0 exit-criterion proof; test deny, timeout, cancellation, and retry paths.

### 1.8 Permission & audit model

- [ ] **P0-12:** Implement permission classification and default-deny connector authorization.
  - **PRD reference:** §13.1, AUTO-004, §16
  - **Acceptance:** Read-only, local reversible, external reversible, external consequential, and destructive actions enforce their specified approval requirements.
  - **Owner:** security
  - **Notes:** Separate connector read/write scopes; expanded scopes require reauthorization and prohibited connectors are denied.
- [ ] **P0-13:** Implement the audit record model and immutable audit writes.
  - **PRD reference:** §13.3, §12.6
  - **Acceptance:** Every agent action records actor, agent/version, trigger, source references, tools, permissions, approvals, external changes, output reference, cost, duration, error, and retry state.
  - **Owner:** eng
  - **Notes:** Reference sensitive content by secure identifier where retaining raw content is unnecessary.

### 1.9 Telemetry & eval harness

- [ ] **P0-14:** Establish privacy-safe telemetry and an agent-evaluation harness.
  - **PRD reference:** §12.2, §14.4, §16
  - **Acceptance:** Instrumented test runs emit required operational signals and execute a versioned baseline eval suite without secret or content leakage.
  - **Owner:** eng
  - **Notes:** Use Braintrust for traces/evals; gate releases on baseline regression thresholds.
- [ ] **P0-15:** Resolve Phase 0 architecture decisions D7 and D8.
  - **PRD reference:** §19 D7-D8, §20
  - **Acceptance:** The collaboration-engine choice and fully-native versus selective-WebView surface policy are documented, approved, prototyped, and reflected in adapters/tests.
  - **Owner:** eng
  - **Notes:** Both are architecture-blocking; revalidate Native SDK assumptions during implementation.

## 2. Phase 1 — Personal MVP

### 2.1 Go Agent chat & task inbox

- [ ] **P1-01:** Deliver Go Agent chat with context attachments and durable task conversion.
  - **PRD reference:** GO-001, GO-002, §16, §17.3
  - **Acceptance:** Users can stream a chat, attach permitted context, save/branch a conversation, convert it to a background task, and resume it after closing the app.
  - **Owner:** eng
  - **Notes:** Context resolution must respect workspace and source permissions.
- [ ] **P1-02:** Deliver the task inbox for runs and user decisions.
  - **PRD reference:** GO-007, §16
  - **Acceptance:** Inbox reliably lists input requests, approvals, failures, completed work, scheduled summaries, and suggested next actions with deep links to runs.
  - **Owner:** ux
  - **Notes:** Badges and notifications must not reveal sensitive content on locked screens.

### 2.2 Document editor & writing core

- [ ] **P1-03:** Deliver the Creature document editor with versioned editable text.
  - **PRD reference:** DOCS-001, DOCS-010, §16, §17.4
  - **Acceptance:** Users create and edit text pages with headings, lists, tables, media/files, and restore a prior version without losing attribution.
  - **Owner:** eng
  - **Notes:** Large agent changes must be reviewable diffs and separately attributed.
- [ ] **P1-04:** Deliver correctness, tone detection/suggestions, and protected rewrites.
  - **PRD reference:** WRITE-001 through WRITE-005, §17.4
  - **Acceptance:** Editor offers categorized correctness and tone suggestions; rewrites preserve names, numbers, citations, links, and protected terminology unless authorized.
  - **Owner:** eng
  - **Notes:** Tone is displayed as an estimate, not an objective judgment.
- [ ] **P1-05:** Deliver on-demand composition and full-document proofreading.
  - **PRD reference:** WRITE-007, WRITE-009, §16, §17.4
  - **Acceptance:** Users generate an editable draft from a prompt/outline/permitted source and proofread a document with grouped issues, explanations, and category batch acceptance.
  - **Owner:** eng
  - **Notes:** Ground source-derived claims and prevent unsupported commitments.

### 2.3 Gmail integration

- [ ] **P1-06:** Connect Gmail/Google Workspace for read, search, cited summary, and draft workflows.
  - **PRD reference:** MAIL-001 through MAIL-003, MAIL-010, §16, §17.2, §17.5
  - **Acceptance:** An authorized user connects Gmail and can search messages, summarize a thread with citations, and create an unsent draft using permitted context.
  - **Owner:** eng
  - **Notes:** Gmail is the first complete mail integration; source-system mail remains canonical.
- [ ] **P1-07:** Enforce approval before all mail sends and consequential mail writes.
  - **PRD reference:** MAIL-004, §7.3, §13.1, §17.6
  - **Acceptance:** No send, external consequential write, or user-facing automation action executes without its required preview and approval.
  - **Owner:** security
  - **Notes:** Auto Drafts must never imply a message was sent; idempotency prevents duplicate external actions.

### 2.4 Google Calendar integration

- [ ] **P1-08:** Connect Google Calendar for read and event-preview workflows.
  - **PRD reference:** MAIL-005, MAIL-015, §16, §17.2, §17.5
  - **Acceptance:** An authorized user can read calendar context and generate an event preview from email; event creation/invitation sending requires confirmation.
  - **Owner:** eng
  - **Notes:** Display extracted event fields and source email before approval.

### 2.5 Basic Docs (pages, attachments, version, share)

- [ ] **P1-09:** Deliver basic pages, secure attachments, local cache, search, version history, and sharing.
  - **PRD reference:** DOCS-001, DOCS-006, DOCS-010, DOCS-011, §16, §17.7
  - **Acceptance:** Users create pages, upload validated/malware-scanned attachments, open cached docs offline, search permitted content, restore versions, and share a document with basic permissions.
  - **Owner:** eng
  - **Notes:** Attachment retention, secure download links, and source-permission enforcement are mandatory.

### 2.6 Memory controls

- [ ] **P1-10:** Deliver personal memory inspection and deletion controls.
  - **PRD reference:** MEM-002, MEM-003, §16, §17.8
  - **Acceptance:** Users can view, correct, pin, scope, disable, delete individual items, export all memory, and disable memory entirely.
  - **Owner:** ux
  - **Notes:** Include communication preferences captured through mail and scheduling workflows.

### 2.7 Manual connectors

- [ ] **P1-11:** Deliver manual connector management and health visibility.
  - **PRD reference:** DOCS-007, AUTO-004, AUTO-005, §16
  - **Acceptance:** Users can explicitly enable/disable a connector, manually refresh it, view scopes/status/last successful sync/token expiry/errors, and reconnect.
  - **Owner:** eng
  - **Notes:** Use Vercel Connect where supported and request least privilege.
- [ ] **P1-12:** Prove the four key journeys and seven-day private-beta workflow readiness.
  - **PRD reference:** §9.1-§9.4, §16, §17.13
  - **Acceptance:** Scripted and observed tests complete email-to-work, document improvement, safe inbox automation simulation/dry-run, and connected project workspace journeys; seven days of representative work require no separate manual agent tracker.
  - **Owner:** ux
  - **Notes:** Capture gaps, rework, undo, and user acceptance evidence before beta.
- [ ] **P1-13:** Pass core Windows, macOS, and Linux desktop flows.
  - **PRD reference:** §16, §17.1, §17.12
  - **Acceptance:** Deterministic desktop and end-to-end tests pass for critical mail, docs, approval, and automation flows on every supported platform.
  - **Owner:** eng
  - **Notes:** Block release on platform-specific failures or untriaged test flakiness.

## 3. Security & Compliance

### 3.1 Secret isolation (SEC-001)

- [ ] **SEC-01:** Enforce SEC-001 secret isolation across every model and persistence boundary.
  - **PRD reference:** SEC-001, §13.2, §17.11
  - **Acceptance:** Connector tokens, API keys, and authentication material are absent from prompts, logs, telemetry, memory, and user-visible errors under automated adversarial tests.
  - **Owner:** security
  - **Notes:** Redact before persistence; revoke/rotate compromised connector sessions.

### 3.2 OS credential storage

- [ ] **SEC-02:** Use the Native SDK operating-system credential service for desktop credentials.
  - **PRD reference:** §12.1, §13.2, §16
  - **Acceptance:** Credential integration tests verify no plaintext secret exists in local databases, files, application logs, or crash reports.
  - **Owner:** security
  - **Notes:** Prefer short-lived service tokens and define logout/disconnect cleanup behavior.

### 3.3 Permission classes & approval gates

- [ ] **SEC-03:** Enforce permission classes and approval gates in every tool invocation.
  - **PRD reference:** §13.1, GO-005, AUTO-003, §17.6
  - **Acceptance:** Tool-policy tests prove consequential writes preview and require approval by default; destructive actions require explicit per-action approval or are blocked.
  - **Owner:** security
  - **Notes:** Policies must constrain action volume, spend, hours, recipients/domains, systems, and required approvers.

### 3.4 Audit logging

- [ ] **SEC-04:** Make audit records queryable, access-controlled, and tamper-evident.
  - **PRD reference:** §13.3, §13.4
  - **Acceptance:** Authorized users can inspect complete action lineage; unauthorized users cannot read audit content or alter historical records.
  - **Owner:** security
  - **Notes:** Support secure references and eventual export/deletion/retention workflows.

### 3.5 Red-team tests

- [ ] **SEC-05:** Pass red-team suites for prompt injection, exfiltration, unsafe writes, and cross-workspace access.
  - **PRD reference:** §14.5, §17.10, §17.11
  - **Acceptance:** Automated attacks neither access unauthorized content nor cause unapproved writes; failures block release and include regression fixtures.
  - **Owner:** security
  - **Notes:** Include malicious connector content, tool-call escalation, secret disclosure, and indirect prompt injection cases.

## 4. Observability

### 4.1 Braintrust evals integration

- [ ] **OBS-01:** Integrate Braintrust for versioned agent evals and durable-run tracing.
  - **PRD reference:** §12.2, §14.5
  - **Acceptance:** Braintrust runs versioned eval datasets for drafting, summarization, grounding, automation planning, and tool selection, and correlates traces to durable run IDs.
  - **Owner:** eng
  - **Notes:** Send only redacted metadata/content permitted by policy; define regression thresholds and review ownership.

### 4.2 Vercel AI Gateway observability

- [ ] **OBS-02:** Instrument AI Gateway routing, fallback, usage, and spend controls.
  - **PRD reference:** §12.3, §15.5
  - **Acceptance:** Dashboards show provider/model choice, fallback events, latency, tokens/usage, and cost per completed workflow; limits stop unsafe spend.
  - **Owner:** devops
  - **Notes:** Attribute shared infrastructure costs by proportional usage and document the formula.

### 4.3 Telemetry signals

- [ ] **OBS-03:** Capture required product and agent telemetry signals.
  - **PRD reference:** §14.4, §15.3-§15.4
  - **Acceptance:** Events cover agent-run latency; model/tool/connector latency; approval wait; retries; suggestion acceptance; automation success; undo/correction; and memory retrieval/correction events.
  - **Owner:** eng
  - **Notes:** Also track durable completion, sync success, duplication, approval delivery, crashes, and offline conflicts with privacy controls.

### 4.4 Error tracking

- [ ] **OBS-04:** Integrate privacy-safe error tracking with release correlation.
  - **PRD reference:** §13.2, §14.2, §14.4
  - **Acceptance:** Client, connector, and agent failures create deduplicated alerts containing release/platform/run correlation while excluding secrets and unnecessary user content.
  - **Owner:** devops
  - **Notes:** Define severity, alert routing, retention, and triage ownership before private beta.

## 5. Testing

### 5.1 Unit tests

- [ ] **TST-01:** Add unit coverage for business rules and tool permission checks.
  - **PRD reference:** §14.5
  - **Acceptance:** Tests cover permission classification, approval decisions, idempotency, memory filtering, redaction, and critical state transitions.
  - **Owner:** eng
  - **Notes:** Run on every pull request and add regressions for escaped defects.

### 5.2 Contract tests

- [ ] **TST-02:** Add connector contract tests.
  - **PRD reference:** §14.5, AUTO-004, AUTO-005
  - **Acceptance:** Gmail, Calendar, and Vercel Connect adapter tests validate scopes, read/search/draft/preview contracts, expiry/reconnect, errors, and no duplicate writes.
  - **Owner:** eng
  - **Notes:** Use sandbox/test accounts and stable provider fixtures.

### 5.3 Native SDK UI tests

- [ ] **TST-03:** Add deterministic Native SDK UI coverage.
  - **PRD reference:** §12.1, §14.5, §17.12
  - **Acceptance:** Platform UI tests cover keyboard navigation, focus, status/timeline, approval, accessibility labels, diffs, and error states without timing-dependent flakes.
  - **Owner:** ux
  - **Notes:** Execute on Windows, macOS, and Linux reference environments.

### 5.4 E2E tests

- [ ] **TST-04:** Add end-to-end tests for critical mail, docs, approval, and automation flows.
  - **PRD reference:** §14.5, §17.12
  - **Acceptance:** Tests validate email search-to-draft, calendar preview, document/version/share, approval/resume, and automation simulation/dry-run paths.
  - **Owner:** eng
  - **Notes:** Use deterministic fixtures and assert no external action occurs before approval.

### 5.5 Agent evals

- [ ] **TST-05:** Gate releases on agent eval quality.
  - **PRD reference:** §12.2, §14.5
  - **Acceptance:** Versioned evals measure drafting, summarization, source grounding, automation planning, and tool selection against reviewed expected outcomes.
  - **Owner:** eng
  - **Notes:** Include citation validity and hallucinated-commitment detection sampling.

### 5.6 Red-team tests

- [ ] **TST-06:** Run required security adversarial tests in CI.
  - **PRD reference:** §14.5, SEC-001, §17.10-§17.11
  - **Acceptance:** Prompt injection, data exfiltration, unsafe writes, and cross-workspace-access suites pass before a release can promote.
  - **Owner:** security
  - **Notes:** Keep fixtures non-production and make failures release-blocking.

## 6. CI/CD & Build Pipeline

### 6.1 CircleCI configuration

- [ ] **CICD-01:** Create `.circleci/config.yml` with required verification jobs.
  - **PRD reference:** §14.5, §16
  - **Acceptance:** Pipeline includes install, typecheck, lint, unit test, contract test, eval, red-team, and desktop-artifact build jobs with dependency ordering and cached dependencies.
  - **Owner:** devops
  - **Notes:** Treat failed eval/red-team thresholds as required checks; never print secrets.

### 6.2 Vercel build pipeline

- [ ] **CICD-02:** Configure Vercel build pipeline and preview deployments.
  - **PRD reference:** §12.2-§12.4, §20
  - **Acceptance:** Backend/service changes receive isolated preview deployments, required environment validation, and smoke checks before promotion.
  - **Owner:** devops
  - **Notes:** Validate evolving Eve, AI SDK, Gateway, and Connect capabilities in previews.

### 6.3 Cross-platform desktop builds

- [ ] **CICD-03:** Build and test a Windows/macOS/Linux desktop matrix.
  - **PRD reference:** §12.1, §14.5, §17.1, §17.12
  - **Acceptance:** CI produces platform-native packages and runs deterministic UI/core-flow tests for each supported platform.
  - **Owner:** devops
  - **Notes:** Use pinned reference images and preserve signing/notarization evidence where applicable.

### 6.4 Artifact publishing

- [ ] **CICD-04:** Publish traceable, integrity-checked build artifacts.
  - **PRD reference:** §12.1, §14.2
  - **Acceptance:** Every eligible build publishes versioned desktop artifacts, checksums, test reports, and provenance; promotion is restricted to approved artifacts.
  - **Owner:** devops
  - **Notes:** Retain rollback-compatible artifacts and do not include credentials in packages.

## 7. Data & Storage

### 7.1 PostgreSQL schema

- [ ] **DATA-01:** Implement PostgreSQL schemas for core product records.
  - **PRD reference:** §12.6, §13.3
  - **Acceptance:** Schema stores users, workspaces, permissions, documents, structured records, automations, run metadata, and audit indexes with workspace-scoped authorization.
  - **Owner:** eng
  - **Notes:** Include migrations, indexes, data ownership, and idempotency/audit correlation fields.

### 7.2 Object storage

- [ ] **DATA-02:** Provision protected object storage for binary and immutable artifacts.
  - **PRD reference:** §12.6, DOCS-006
  - **Acceptance:** Attachments, exports, generated artifacts, and immutable snapshots use encrypted storage, validated content types, malware scanning, and secure expiring downloads.
  - **Owner:** devops
  - **Notes:** Enforce plan limits and retention without exposing direct object locations.

### 7.3 Search index

- [ ] **DATA-03:** Build permission-aware lexical and semantic retrieval indexing.
  - **PRD reference:** §12.6, GO-006, DOCS-009
  - **Acceptance:** Search returns only content the requesting user may access, and grounded answers link each source-backed claim to its canonical source.
  - **Owner:** eng
  - **Notes:** Index provenance, workspace/source ACLs, refresh/deletion propagation, and avoid indexing secrets.

### 7.4 Local encrypted database

- [ ] **DATA-04:** Store permitted offline data in a local encrypted database.
  - **PRD reference:** §12.6, §14.1
  - **Acceptance:** Cached documents, message metadata, drafts, offline operations, and desktop preferences are encrypted at rest and removed/invalidated on required logout or permission loss.
  - **Owner:** security
  - **Notes:** Keep credentials in the OS credential store, not this database.

### 7.5 Backup & retention

- [ ] **DATA-05:** Define and test backup, restore, and retention policies.
  - **PRD reference:** §13.4, DOCS-006, DOCS-010
  - **Acceptance:** Restore testing proves recovery of required PostgreSQL/object data; retention/deletion policies cover attachments, versions, memory, audit references, and exports.
  - **Owner:** devops
  - **Notes:** Document recovery objectives and verify deletion propagation to search/indexed copies.

## 8. Launch Readiness

### 8.1 Reference environments

- [ ] **LCH-01:** Publish supported Windows, macOS, and Linux reference environments.
  - **PRD reference:** §14.1, §17.1
  - **Acceptance:** Hardware/OS versions, installation prerequisites, performance baselines, and known limitations are documented and used by CI/release qualification.
  - **Owner:** devops
  - **Notes:** Requalify after OS, Native SDK, or packaging changes.

### 8.2 Rollback plan

- [ ] **LCH-02:** Exercise desktop and backend rollback procedures.
  - **PRD reference:** §12.1, §14.2
  - **Acceptance:** A release can revert desktop update channels and service deployments while preserving durable runs, data compatibility, and audit continuity.
  - **Owner:** devops
  - **Notes:** Test migration compatibility and communicate forced-update behavior.

### 8.3 On-call runbook

- [ ] **LCH-03:** Publish an on-call runbook for MVP services and connectors.
  - **PRD reference:** §14.2, AUTO-005, §15.4
  - **Acceptance:** Runbook covers provider outage, connector expiry, duplicate action, stuck approval/run, data-access incident, secret exposure, rollback, and escalation paths.
  - **Owner:** devops
  - **Notes:** Link dashboards, alerts, status communications, and incident evidence requirements.

### 8.4 Feature flags

- [ ] **LCH-04:** Gate risky features with scoped feature flags.
  - **PRD reference:** §7.6, §13.1, §18
  - **Acceptance:** Agent tools, model policies, connector capabilities, automation modes, and rollout cohorts can be disabled immediately by workspace/user/platform without redeploy.
  - **Owner:** eng
  - **Notes:** Flags must be auditable, default safe, and tested in rollback drills.

## 9. Service Integration Details

### 9.1 Braintrust

- [ ] **SVC-01:** Configure Braintrust eval, prompt-versioning, and durable-run tracing integration.
  - **PRD reference:** §12.2, §14.5
  - **Acceptance:** Braintrust receives redacted trace/eval records tied to prompt and agent versions; required environment variables (`BRAINTRUST_API_KEY`, `BRAINTRUST_PROJECT`, `BRAINTRUST_ENVIRONMENT`) are validated at startup.
  - **Owner:** eng
  - **Notes:** Define retention/redaction policy and fail closed for production tracing configuration errors.

### 9.2 Vercel AI Gateway

- [ ] **SVC-02:** Configure Vercel AI Gateway provider routing, fallback, spend, and model policy.
  - **PRD reference:** §12.3, §19 D9
  - **Acceptance:** Gateway routes by task class and plan, applies fallback and allowlists, enforces spend limits, and validates `AI_GATEWAY_API_KEY`, `AI_GATEWAY_BASE_URL`, and model-policy configuration at startup.
  - **Owner:** devops
  - **Notes:** Keep actual provider credentials server-side and emit redacted routing telemetry only.

### 9.3 CircleCI

- [ ] **SVC-03:** Configure CircleCI jobs, platform matrix, and artifact retention.
  - **PRD reference:** §14.5, §17.12
  - **Acceptance:** `.circleci/config.yml` runs install, typecheck, lint, unit/contract/eval/red-team tests, and Windows/macOS/Linux desktop builds, publishing artifacts and reports.
  - **Owner:** devops
  - **Notes:** Store service credentials only in protected contexts; restrict artifact access and promotion.

### 9.4 Vercel

- [ ] **SVC-04:** Configure Vercel previews, production builds, and managed connectors through Vercel Connect.
  - **PRD reference:** §12.4, AUTO-004, AUTO-005, §20
  - **Acceptance:** Preview deployments validate configuration; production promotes approved builds; Vercel Connect manages supported connector authorization and passes short-lived, least-privilege credentials only to the invoking tool.
  - **Owner:** devops
  - **Notes:** Required environment variables include `VERCEL_ENV`, `VERCEL_URL`, and Vercel Connect configuration supplied through protected deployment settings; never expose long-lived provider credentials to agents.
