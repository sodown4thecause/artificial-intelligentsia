# Phase 0 — Implementation Scaffold

Proposed repo/package structure to satisfy PRD §12 (Architecture) and §16 (Phases) Phase 0 exit criteria. This is a scaffolding proposal derived from the spec package; not yet implemented.

## Module map (PRD §12 → package)
| PRD § | Package | Purpose |
|-------|---------|---------|
| 12.1 | `apps/desktop` | Native SDK shell (Win/Mac/Linux), nav, cold-start, offline |
| 12.2 | `integrations/connectors` | Vercel Connect wrappers (Gmail, Calendar) + token lifecycle |
| 12.3 | `core/ai-gateway` | AI SDK 7 provider routing, fallback, per-plan model policy (D9) |
| 12.4 | `core/mnemosyne` | Memory store, provenance, confidence, secret boundary (G9) |
| 12.5 | `core/team` | Workspace roles, analytics (aggregate-first), policy controls |
| 12.6 | `core/automation` | Automation engine, dry-run, permission model (AUTO-001..005) |
| 12.7 | `core/collab` | CRDT/operation model, attribution, permission-aware sync (D7) |
| 13 | `core/security` | Secrets, audit log, access control, compliance export |
| 14 | `core/observability` | Telemetry, agent-eval harness, red-team hooks |

## Phase 0 exit criteria (§16) → verification targets
1. Start/close/reopen/resume durable task → `apps/desktop` + `core/ai-gateway` E2E.
2. Risky mock tool pauses for approval + resumes → `core/security` approval primitive.
3. Desktop creds via OS credential service → `integrations/connectors` + OS keystore.

## Open decision hooks (Gate 0)
- `D8` surface strategy → `apps/desktop` config flag (native vs WebView).
- `D9` model policy → `core/ai-gateway` policy table.
- `D7` collab engine → `core/collab` interface (deferred to Phase 3).

## Suggested skeleton (not created)
```
apps/desktop/            # Native SDK entry, nav, run/approval UI
integrations/connectors/ # gmail.ts, calendar.ts, token-store.ts
core/ai-gateway/         # router.ts, policy.ts, fallback.ts
core/mnemosyne/          # store.ts, boundary.ts, provenance.ts
core/automation/         # engine.ts, dryrun.ts, perms.ts
core/security/           # secrets.ts, audit.ts, approvals.ts
core/observability/      # telemetry.ts, eval.ts, redteam.ts
spec/                    # (this package)
```

**Status:** scaffold documented; actual package creation pending your go-ahead (would require initializing the Eve/Native SDK project in the repo).
