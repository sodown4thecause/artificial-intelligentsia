# Gap Analysis

Synthesis of W1 (FR catalog), W4 (trust), W9 (open decisions), W10 (journey traceability), W2/W8 (packaging/roadmap).

## A. Functional gaps (missing/weak FRs)
| ID | Gap | Evidence | Severity | Recommendation | Status |
|----|-----|----------|----------|----------------|--------|
| G1 | AI-view output schema not specified | DOCS-004 lacks status/decisions/owners/next-actions schema (J4) | Medium | Add DOCS-004.x or clarify prompt output contract in Phase 1 | Integrated into PRD v1.1 — DOCS-004 output schema expanded |
| G2 | Automation simulation replay UI unspecified | AUTO-002 dry-run + MAIL-007 sim; no replay UX FR | Low | Add automation-preview FR or fold into AUTO-002 scope note | Integrated into PRD v1.1 — AUTO-002 simulation replay noted |
| G3 | Communication-preference memory workflow implicit | MEM-002 lists preference type; no capture-step FR distinct from generic store | Low | Confirm MEM-003 capture covers it; no new FR needed | Closed — no PRD change needed; MEM-003 clarified |

## B. Packaging vs phase conflicts
| ID | Conflict | Evidence | Resolution | Status |
|----|----------|----------|------------|--------|
| G4 | WRITE-011 plagiarism: packaging gates to Business, but Pro "Trial/add-on" ambiguous whether Phase 2 exposes trial | W2 vs §11 | Consistent: Pro=trial/add-on, Business=included. No conflict. | Closed — no gap |
| G5 | DOCS-013 MCP: "Included" at Business; Phase 2 lists under Pro productivity? | W2 vs §16 | §16 Phase 2 lists MCP as capability; packaging gates admin-control to Business. Align: Phase 2 = Pro MCP limited, Business = admin-controlled. Recommend explicit Pro "limited trial" row. | Integrated into PRD v1.1 — MCP Pro "Limited trial" row in §11 |
| G6 | MAIL-016 shared mail: Pro "None/Trial", Business "Included" | W2 vs §11 | Consistent. | Closed — no gap |

## C. Trust/architecture gaps (from W4)
| ID | Gap | Severity | Note | Status |
|----|-----|----------|------|--------|
| G7 | No explicit FR for *deny-listing* connectors under AUTO-004 (only enable/disable + approvals) | Low | Default-deny is a security stance, not an FR; ensure AUTO-004 scope covers it | Integrated into PRD v1.1 — AUTO-004 deny-listing noted |
| G8 | Approval UX for cross-surface (docs automation triggering mail send) not explicitly FR'd | Medium | GO-005 covers approvals; recommend clarifying multi-surface approval surfacing in Phase 0 | Integrated into PRD v1.1 — GO-005 cross-surface approval clarified |
| G9 | Secret isolation enforcement has no standalone FR outside MEM-001 boundary + §13 | High | Recommend explicit FR: "connector tokens never enter prompt/telemetry/memory" (acceptance criterion 11) — promote to FR. | Integrated into PRD v1.1 — SEC-001 added as explicit FR in §13.2 |

## D. Measurement gaps (from W7)
| ID | Gap | Severity | Status |
|----|-----|----------|--------|
| G10 | "Cost per completed workflow" has no allocation formula for shared infra | Low | Integrated into PRD v1.1 — §15.5 cost formula noted |
| G11 | Hallucinated-commitment rate needs a heuristic detector; no native signal | Medium | Integrated into PRD v1.1 — §15.3 hallucination detector noted |
| G12 | "Estimated time saved / ROI" (TEAM-003) must stay explicitly estimated; no disclosure-FR for estimates | Medium | Integrated into PRD v1.1 — TEAM-003/004 estimate-disclosure added |

## E. Assumption risk (from W9/W5)
| ID | Gap | Severity | Status |
|----|-----|----------|--------|
| G13 | All W9 technical assumptions unvalidated (Eve/AI SDK7/Native SDK/Connect) | High (blocking Phase 0) | Integrated into PRD v1.1 — §20 validation status noted |
| G14 | D8 (native vs WebView), D9 (default model policy), D7 (collab engine) unresolved — architectural | High | Integrated into PRD v1.1 — §19 D7/D8/D9 marked as blocking |

## Priority order
All 14 gaps are closed or integrated into PRD v1.1. Remaining open architectural decisions D7, D8, and D9 remain blocking Phase 0 gates and are tracked in `decision-gates.md`.
