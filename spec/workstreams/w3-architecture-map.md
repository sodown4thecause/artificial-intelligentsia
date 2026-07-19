# W3 — Architecture Component Map

Component inventory derived from PRD §12, §20, §7.1, §7.5.

## Component responsibilities & boundaries

### Native SDK desktop client (§12.1, §7.1)
- **Responsibilities:** native windows/rendering, navigation & workspace UI, keyboard/command palette, system tray & notifications, clipboard/file dialogs, OS credential storage, local cache & offline queues, packaging/updates, deterministic UI automation/testing.
- **Isolation requirement:** strict service boundary between UI state and remote services so Native SDK API changes don't propagate into business logic (adapter layer mandatory).
- **Integration points:** Eve runtime (session/approval UI), local encrypted DB (cache), OS credential service.
- **Secret boundary:** credentials stored via OS credential service through Native SDK; never in app memory longer than needed.

### Eve agent runtime (§12.2)
- **Responsibilities:** agent defs, instructions, tools, skills, subagents, channels, schedules, durable session state, pause/approval/resume/retry/cancel, sandboxed work, evals & lifecycle hooks.
- **Isolation requirement:** domain tools independent of Eve-specific registration code (Risk 3 mitigation).
- **Recommended agent tree:**
  ```
  agent/
    agent.ts
    instructions.md
    skills/      compose-email, proofread-document, summarize-thread, create-automation, prepare-meeting
    tools/       mail/, calendar/, docs/, search/, memory/, approvals/
    subagents/   researcher/, writer/, mail-triage/, document-organizer/, automation-planner/
    schedules/   daily-brief.ts, follow-up-check.ts, connector-refresh.ts
    hooks/       audit.ts, telemetry.ts, memory-candidate.ts
  ```
- **Integration points:** AI SDK 7 (tool/model layer), Mnemosyne (memory requests), Native SDK (UI), AI Gateway (routing).

### AI SDK 7 (§12.3)
- **Responsibilities:** streaming, structured output, tool calls, tool approvals, runtime/tool context, model reasoning config, file/skill refs, telemetry/lifecycle.
- **Isolation requirement:** provider-neutral layer beneath Eve; keep Workflow-compatible boundaries for critical workflows (Risk 3).

### AI Gateway (§12.3)
- **Responsibilities:** provider routing, model fallback, cost/usage visibility, per-plan & per-workspace model policy, provider-outage mitigation, model allowlists.
- **Integration points:** routes routine classification/rewrite/extract/summarize to lower-cost models; reserves stronger models for planning/synthesis/high-impact drafts (§12.3 default policy).

### Vercel Connect (§12.4)
- **Responsibilities:** preferred auth & connector layer; managed connectors; short-lived credentials.
- **Secret boundary:** long-lived credentials never exposed to agent or stored in prompts; connector tools receive only required creds/context per call.

### Mnemosyne (§12.5, MEM-001..005)
- **Responsibilities:** memory indexing, retrieval, consolidation, lifecycle, deletion (separate service boundary).
- **Write pipeline:** candidate extraction → sensitive-content filtering → dedup/conflict detection → user/policy approval → retention+provenance metadata.
- **Secret boundary:** no secrets/credentials; separate inferred vs user-confirmed; explicit controls.

### Product data stores (§12.6)
- **PostgreSQL:** users, workspaces, permissions, documents, structured records, automations, run metadata, audit indexes.
- **Object storage:** attachments, exports, generated artifacts, immutable snapshots.
- **Search index:** lexical + semantic retrieval over permitted content.
- **Local encrypted DB:** cached docs, message metadata, drafts, offline ops, desktop prefs.
- **Source systems canonical:** connected mail/calendar/CRM/external docs remain canonical unless explicitly imported.

### Collaboration & sync (§12.7)
- **Model:** operation-based or CRDT-compatible.
- **Properties:** concurrent editing, offline edits, reconnection, presence, attribution, version restoration, permission-aware synced blocks.
- **Attribution:** agent edits attributed separately from human edits; large modifications presented as reviewable changes.

## Cross-component secret-flow
```
OS credential service ←(Native SDK)→ Connector tools (per-call scoped creds)
AI Gateway hides provider tokens from agent prompts/logs/telemetry/memory (§13.2)
Mnemosyne excludes credentials/tokens/keys (MEM-005, §13.2)
```
