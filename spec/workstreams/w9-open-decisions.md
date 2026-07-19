# W9 — Open Decisions & Assumptions Register

Derived from PRD §19, §20, §5.

## Open product decisions (§19)
| ID | Decision | Options | Blocking? | Gates phase |
|----|----------|---------|-----------|-------------|
| D1 | Final product & module names | TBD | non-blocking | naming only |
| D2 | Exact pricing & fair-use limits | TBD | non-blocking | commercial, not arch |
| D3 | Plagiarism checking model | included / add-on / partner | non-blocking | Phase 1 packaging |
| D4 | Launch-quality languages | verify per language | non-blocking | Phase 1 (WRITE-008) |
| D5 | Pro shared-mail collaboration | include? | non-blocking | Phase 3 (MAIL-016) |
| D6 | Custom domains start tier | Pro vs Business | non-blocking | Phase 3 (DOCS-012) |
| D7 | Collaborative doc engine | internal vs existing CRDT | **non-blocking but architectural** | Phase 3 (DOCS-011) |
| D8 | Native vs WebView UI surfaces | which fully native | **architectural** | Phase 0 (§12.1, R2) |
| D9 | Default model per task class | which model for classify/plan/draft | **architectural** (drives AI Gateway policy §12.3) | Phase 0 |
| D10 | Enterprise regions & compliance | which commitments | non-blocking | Phase 4 (TEAM-005) |

**Blocking-for-architecture:** D7, D8, D9 (must be resolved before/within Phase 0–1 to avoid rework).

## Technical-source assumptions (§20) — validation checklist
| Assumption | What to revalidate | Verification method |
|-----------|-------------------|---------------------|
| Vercel Eve is filesystem-first TS framework w/ agents/tools/skills/subagents/schedules/durable/approvals | current Eve API surface & durable-session semantics | build Phase-0 Eve scaffold; run mock approval pause/resume (Phase 0 exit criteria) |
| AI SDK 7 provider-neutral (tool/runtime context, approvals, durability, telemetry, skills) | SDK version & feature parity | pin version; integration smoke test (Phase 0) |
| Native SDK native desktop render + OS caps + packaging + secure creds | desktop maturity on Win/Mac/Linux | cold-start + credential-store test on 3 OS (Phase 0/1 exit) |
| Vercel Connect managed connectors + short-lived creds | connector catalog + token lifecycle | connect Gmail/Calendar; confirm token scope + refresh (Phase 1) |

All assumptions explicitly "must be revalidated during implementation because Eve and Native SDK are new and evolving" (§20).
