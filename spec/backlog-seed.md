# Backlog Seed

Epics → stories derived from FR anchors (W1) + gap analysis (GA). Priority: P0 (Phase 0 blocking), P1 (MVP), P2 (Pro), P3 (Business), P4 (Enterprise).

## Epic E0 — Foundations (Phase 0)
- S0.1 Native desktop shell (Win/Mac/Linux) + cold start <2s — GO-003/§12.1 [P0]
- S0.2 OS credential store integration (no plaintext) — §12, GA-G9 [P0]
- S0.3 Eve durable-session scaffold + pause/resume — GO-002 [P0]
- S0.4 Approval UI primitive (surfacing + resume) — GO-005 [P0]
- S0.5 AI SDK 7 + AI Gateway model-routing + fallback — §12.3 [P0]
- S0.6 Mnemosyne boundary + secret isolation — MEM-001, GA-G9 [P0]
- S0.7 Permission/audit layer — §13 [P0]
- S0.8 Telemetry + agent-eval harness — §14.4/14.5 [P0]
- S0.9 Resolve D7/D8/D9 decisions — GA-G14 [P0]

## Epic E1 — Personal MVP (Phase 1)
- Go Agent chat + task inbox — GO-001/002/004 [P1]
- Doc editor + writing core (WRITE-001..009) — J2 [P1]
- Gmail read/search/summarize/draft — MAIL-001/002/003/005/010 [P1]
- Calendar read + event preview — MAIL-015 [P1]
- Basic Docs (pages/attachments/version/share) — DOCS-001/002/006/010 [P1]
- Memory controls (inspect/delete) — MEM-002/003/004/005 [P1]
- Manual connectors — GO-004 [P1]
- AI-view output schema (close G1) — DOCS-004 [P1]
- Cross-surface approval UX (close G8) — GO-005 [P1]

## Epic E2 — Pro Productivity (Phase 2)
- Split Inbox + Auto Drafts/Labels/Reminders/Summaries/Archive — MAIL-004/006/007/008/009/011/012/013 [P2]
- Translation + advanced rewrite — WRITE-008 [P2]
- Databases + Forms — DOCS-003/008 [P2]
- Cross-doc tables — DOCS-009 [P2]
- Automation builder + AUTO-001..005 — J3 [P2]
- Agent catalogue + MCP (limited) — GO-004/DOCS-013 [P2]
- Offline mail/docs — §5 [P2]
- Plagiarism (trial/add-on) — WRITE-011 [P2]

## Epic E3 — Business Collaboration (Phase 3)
- Shared mail convo/comments/drafts — MAIL-016 [P3]
- Realtime collaboration + CRDT engine (resolve D7) — DOCS-011 [P3]
- Shared snippets/knowledge/style/brand — WRITE-012/013/014 [P3]
- Hourly refresh + AI views + cross-doc actions — DOCS-004/007/009 [P3]
- Workspace analytics + ROI + comm-score (disclosure FR for G12) — TEAM-002/003/004 [P3]
- CRM read-only — MAIL-014 [P3]
- Roles + admin policy — TEAM-001 [P3]

## Epic E4 — Enterprise Ready (Phase 4)
- SSO/SCIM — TEAM-005 [P4]
- Domain capture — TEAM-005 [P4]
- Audit export / retention / legal — TEAM-005/§13 [P4]
- Model/connector/agent/MCP allowlists — DOCS-013/GO-004 [P4]
- Regional + managed desktop — §5 [P4]

## Epic E5 — Expansion (Phase 5)
- MS mail/calendar — MAIL-001 [future]
- Partner agents/connectors — GO-004 [future]
- System-wide writing — WRITE-* [future]
- Mobile — §5 non-goal lift [future]
- Dev/data agents + GitHub PR — §5 [future]

## Backlog hygiene
- Promotion FR for secret isolation (GA-G9) → add to E0 as S0.6.x.
- Simulation-replay story (GA-G2) → add to E2 automations.
- Cost-allocation story (GA-G10) → E3 analytics.
- Hallucination-detector story (GA-G11) → E1 quality.
