# W8 — Roadmap Phasing & Dependency Graph

Maps PRD §16 (Phases 0–5) to FR IDs and plan tiers; records inter-phase dependencies.

## Phase feature → FR mapping
| Phase | Features | FR anchors | Tier (§11) |
|-------|----------|-----------|-----------|
| 0 Foundations | Native shell, auth, Eve scaffold, AI SDK7+Gateway, Mnemosyne boundary, local cache, run/approval UI, perm/audit, telemetry/eval | GO-002/005, MEM-001, §12, §13 | all |
| 1 Personal MVP | Go chat + task inbox, doc editor, writing core, Gmail read/search/summ/draft, Calendar read+preview, basic Docs, snippets, memory controls, manual connectors | GO-001..007, WRITE-001..009, MAIL-001/002/003/005/010/015, DOCS-001/002/003/006/010, MEM-002/003, GO-004 | F/P |
| 2 Pro productivity | Split Inbox, Auto Drafts/Labels/Reminders/Summaries/Archive, translation+adv rewrite, DB+forms, cross-doc tables, daily refresh, automation builder, agent cat + MCP, offline mail/docs | MAIL-004/006/007/008/009/011/012/013, WRITE-008/010/011/012/013/014, DOCS-004/005/007/008/009/011/012/013, AUTO-001..005, GO-004 | P/B |
| 3 Business collab | shared mail convo/comments/drafts, realtime collab, shared snippets/knowledge/style/brand, hourly refresh, AI views, cross-doc actions, workspace analytics + ROI, CRM RO, roles/admin policy | MAIL-016, DOCS-011/012, WRITE-012/013/014, DOCS-004/009/011, TEAM-001/002/003/004, MAIL-014 | B/E |
| 4 Enterprise ready | SSO/SCIM, domain capture, advanced audit/export, retention/legal, model/connector/agent/MCP allowlists, regional, managed desktop, contracted quotas | TEAM-005, DOCS-013, GO-004 | E |
| 5 Expansion | MS mail/calendar, partner agents/connectors, system-wide writing, mobile eval, dev/data agents + GitHub PR | MAIL-001 (later), §5 non-goals lift | future |

## Dependency edges
- Phase 1 ⟶ Phase 2: Docs editor (DOCS-001) prerequisite for realtime collab (DOCS-011) and cross-doc actions (DOCS-009).
- Phase 1 ⟶ Phase 3: shared drafts/comments (MAIL-016) require stable Gmail workflows (MAIL-001) + basic Docs.
- Phase 0 ⟶ Phase 1: durable session + approval UI (GO-002/005) gate all later automation.
- Phase 2 ⟶ Phase 3: automation builder (AUTO-001..005) + MCP (DOCS-013) prerequisite for admin-controlled governance.
- Phase 3 ⟶ Phase 4: roles/admin policy (TEAM-001) prerequisite for SSO/SCIM/allowlists.

## Phase-gate conflicts (see gap analysis)
- DOCS-013 MCP listed "Included" at Business (§11) but Phase 3 also lists it — consistent.
- MAIL-016 shared mail "None/None-or-trial" at Pro but Phase 3 Business — consistent (Pro trial, Business included).
- WRITE-011 plagiarism "Trial/add-on" at Free/Pro but "Included or pooled" Business — packaging vs Phase 2 (Pro productivity) lists plagiarism under Pro? No conflict: Phase 2 doesn't claim plagiarism; packaging gates it to Business.
