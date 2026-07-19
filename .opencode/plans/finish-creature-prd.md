# Plan: Finish CREATURE_PRD_EVE_NATIVE_SDK.md

**Goal:** Update `prd/CREATURE_PRD_EVE_NATIVE_SDK.md` from Draft 1.0 to a revised draft by incorporating `spec/` analysis findings, then open PRs.

**Models:** All execution via OpenAI (gpt-5.6-sol for planning/synthesis, gpt-5.6-terra for implementation).

**Current state:** PRD is Draft 1.0 (1332 lines, 65 FRs). `spec/` directory contains 10 workstreams (W1-W10), gap analysis (G1-G14), decision gates (5), traceability graph. All companion analysis is complete but not yet incorporated into the PRD.

---

## Phase 1 — Gap Injection (1-2 agents)

**Task:** Inject missing requirements and fixes from `spec/gap-analysis.md` directly into PRD.

### Changes to make

**G1 (Medium):** DOCS-004 — Add `scope, prompt, output schema (status/decisions/owners/next-actions), refresh policy, approval policy, source visibility` to AI views spec. Include: "show when generated + which records included."

**G2 (Low):** AUTO-002 — Add note: "simulation replay shows which messages would have matched during historical period." Fold into existing modes spec.

**G3 (Low):** MEM-003 — Confirm communication-preference capture workflow is covered. Add one clarifying sentence.

**G5 (Medium):** §11 packaging matrix — Add explicit "Pro: limited trial" row for DOCS-013 MCP. Current matrix shows "Limited trial / Included / Admin-controlled / Allowlisted" — make Pro row explicit.

**G7 (Low):** AUTO-004 — Add deny-listing scope: "default-deny stance: connectors must be explicitly enabled. Administrators may maintain prohibited-connector lists."

**G8 (Medium):** GO-005 — Add: "Cross-surface approvals: when a Docs automation triggers a mail action, the approval surfaces in the action's native surface (Mail) while showing the originating context (Docs automation)."

**G9 (High):** §13 — Promote acceptance criterion 11 to explicit numbered FR. Add new requirement under §13.2: "SEC-001: Connector tokens, API keys, and authentication material must never appear in model prompts, logs, telemetry, memory, or user-visible error messages. Must pass automated red-team validation."

**G10 (Low):** §15.5 — Add note: "Cost per completed workflow = total model + infra cost ÷ completions. Shared infra costs are allocated by proportional usage. Formula documented in companion spec."

**G11 (Medium):** §15.3 — Add: "Hallucinated commitment rate: heuristic detector flags inserted dates, prices, promises, deadlines, commitments in mail drafts. Rate = flagged ÷ total drafts. Requires periodic manual sampling for calibration."

**G12 (Medium):** TEAM-003/TEAM-004 — Add: "Any metric labeled 'estimated' must display an inline disclosure. ROI reports must not present estimated time savings as exact financial return. Effective Communication Score must not be used as covert employee-performance measure."

**G13 (High):** §20 — Update status: "Unvalidated — must be proven during Phase 0." Add verification method column reference.

**G14 (High):** §19 — Add note: "D7, D8, D9 are architecture-blocking and must be resolved before Phase 0 begins. See spec/decision-gates.md."

### FR numbering check
- G9 adds SEC-001 as a new FR under §13
- Verify no existing FR with ID SEC-001 or conflict

### Verification
- All 14 gaps have a corresponding action
- No duplicate or conflicting FRs created
- Section numbering intact after edits

---

## Phase 2 — Update Companion Spec Files (1 agent)

**Task:** Sync companion spec files to reflect gap closures.

### Files to update

1. `spec/gap-analysis.md` — Add closure status to each gap row:
   - Column: `Status` → "Integrated into PRD v1.1" or "Closed — no PRD change needed"
2. `spec/decision-gates.md` — Update Gate 0:
   - G9 status: "CLOSED — SEC-001 added to §13"
   - G13/G14 status: "Referenced in PRD §19/§20 updated notes"
3. `spec/workstreams/w1-fr-catalog.md` — Add SEC-001 row if type is security FR

### Verification
- Spec files internally consistent with updated PRD
- No stale references to draft-only gaps

---

## Phase 3 — Status Bump & Final Polish (1 agent)

**Task:** Finalize the PRD document.

### Changes
1. Status line (line 4): "Draft 1.0" → "Revised Draft 1.1"
2. Add changelog block after line 4:
   ```markdown
   ## Changelog
   - **Revised Draft 1.1 (2026-07-19):** Incorporated spec gap analysis (G1-G14).
     Added SEC-001 secret-isolation FR. Added AI-view output schema to DOCS-004.
     Added deny-listing to AUTO-004. Updated §15 metrics with detector approaches.
     Updated §20 technical-assumption status. Resolved packaging vs phase alignment.
   ```
3. Verify no numbering gaps (e.g., no §10.1.5 followed by §10.2 without intervening sections)
4. Read final document once for coherence

### Verification
- Status reads "Revised Draft 1.1"
- Changelog present and accurate
- All sections flow logically

---

## Phase 4 — Open PRs (1 agent)

**Task:** Open 3 pull requests.

### PR 1: PRD Update
- **Files:** `prd/CREATURE_PRD_EVE_NATIVE_SDK.md`
- **Title:** "docs: incorporate spec gap analysis into PRD"
- **Body:** Summary of each gap addressed

### PR 2: Spec Companion Updates
- **Files:** `spec/gap-analysis.md`, `spec/decision-gates.md`
- **Title:** "docs: mark gaps closed, update decision gates"
- **Body:** Maps each gap to its PRD action

### PR 3: FR Catalog Sync
- **Files:** `spec/workstreams/w1-fr-catalog.md`
- **Title:** "docs: add SEC-001 to FR catalog"
- **Body:** New security FR from G9 promotion

---

## Stopping Condition

All 4 phases complete. PRD at "Revised Draft 1.1" with:
- 14 gaps addressed (text edits or explicit notes)
- 66+ FRs (65 original + SEC-001)
- 3 PRs opened

---

## Agent Orchestration Notes

- **Phase 1:** Delegate to @medium (gpt-5.6-terra) — mechanical text injection, needs clear instruction
- **Phase 2:** Delegate to @medium (gpt-5.6-terra) — companion file sync
- **Phase 3:** Delegate to @medium (gpt-5.6-terra) — final polish
- **Phase 4:** Delegate to @medium (gpt-5.6-terra) — PR creation
- **Acceptance blocks:** Each phase includes a verification step before next phase starts
