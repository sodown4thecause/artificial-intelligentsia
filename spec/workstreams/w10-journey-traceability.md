# W10 — Journey → Requirement Traceability

Derived from PRD §9 (journeys), §10 (FRs), §6 (personas), §8 (surfaces).

## Journey → FR map
### J1: Email request → completed work (§9.1)
GO-002 (durable), GO-005 (approval), MAIL-002/003/004/005/006, DOCS-001/002, MEM-001/003 (store pref). Surfaces: Go Agent, Mail, Docs, Admin.
### J2: Improve writing across doc (§9.2)
WRITE-001..006/009 (suggestions, tone, rewrite, inclusivity, citation, proofreader), DOCS-002. Surfaces: Write, Docs.
### J3: Inbox automation safely (§9.3)
MAIL-007/008 (archive/labels), AUTO-001..005 (model/modes/safety/perms/health), GO-005. Surfaces: Automations, Mail, Admin.
### J4: Project workspace from sources (§9.4)
DOCS-003/004/005/009 (DB/AI views/automations/cross-doc), MAIL-014/015 (CRM/calendar), GO-006 (citations). Surfaces: Docs, Connections.

## Persona → FR map
- **P1 Independent professional (§6.1):** GO-002/003/004, WRITE-*, MAIL-001/002/003/006, DOCS-001/002/003, MEM-002/003, GO-007.
- **P2 Small team (§6.2):** + MAIL-016, DOCS-011/012, TEAM-001/002, WRITE-012/013/014, CRM read-only (MAIL-014).
- **P3 Managed org (§6.3):** + TEAM-003/004/005, AUTO-003/004, security/audit (§13), SSO/SCIM (Phase 4).

## 🚩 Uncovered journey steps (no direct FR)
- J1 step 7 "store approved comm preference in Mnemosyne when user opts in" → covered by MEM-002/003 (partial); no explicit FR for *communication-preference* memory scope beyond generic. **Gap: MEM-002 list lacks explicit "communication preferences" capture workflow** (it is listed in MEM-002 types, so OK — resolved).
- J3 step 3 "historical simulation preview" → AUTO-002 dry-run + MAIL-007 sim; **no explicit FR for simulation replay UI** beyond modes. Minor gap.
- J4 "AI view shows status/decisions/open Qs/owners/next actions" → DOCS-004 covers scope/prompt/schema/refresh/approval but **does not enumerate status/decisions/owners output schema**. Gap.

## 🚩 Orphan requirements (weak journey linkage)
- WRITE-010 (AI detection), WRITE-011 (plagiarism): no journey references them; only relevant to J2 indirectly. Acceptable (content-quality, not workflow).
- TEAM-003 (ROI), TEAM-004 (comm score): admin-only, no user journey. By design.
- DOCS-006 (attachments malware scan), DOCS-008 (forms), DOCS-013 (MCP): no journey step; platform capabilities.
- GO-004 (agent catalogue): surfaces only, no journey step. Acceptable.

## Verdict
No orphan is architecturally blocking. Minor gaps: simulation-replay UI (J3), AI-view output schema (J4). Recommend adding 1–2 FRs or clarifying DOCS-004 in Phase 1.
