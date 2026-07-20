# Decision Gates

Formal gates to resolve open decisions (W9) and gaps (GA) before they block downstream phases. Owner = function; tied to PRD phases.

## Gate 0 — Architecture Sign-off (Phase 0 entry/exit)
| Decision | Owner | Blocks | Status |
|----------|-------|--------|--------|
| D8 Native vs WebView surfaces | Eng Lead | Phase 0 UI shell | CLOSED — native-first hybrid decided; see `spec/decisions/D8-native-webview.md` |
| D9 Default model policy per task class | AI Lead | AI Gateway config | CLOSED — gateway aliases and task-class routing decided; see `spec/decisions/D9-model-policy.md` |
| D7 Collab engine (internal vs CRDT) | Arch | Phase 3 DOCS-011 | OPEN (defer to Phase 3) — exception documented in `spec/decisions/D7-collab-engine.md` |
| G13 Validate Eve/AI SDK7/Native SDK/Connect assumptions | Eng | all phases | UPDATED — validation checklist created in `spec/workstreams/w9-open-decisions.md`; Phase 0 exit must still prove |
| G9 Promote secret-isolation to explicit FR | Security | acceptance 11 | CLOSED — SEC-001 added to §13.2 |

**Exit:** assumptions validated via Phase 0 exit criteria (§16); D8/D9 resolved; D7 deferred to Phase 3 with documented exception; secret-isolation FR written.

## Gate 1 — MVP Scope Lock (Phase 1 exit)
| Decision | Owner | Blocks | Status |
|----------|-------|--------|--------|
| D1 Product/module names | Product | naming only | OPEN |
| G1 AI-view output schema | Product+Eng | DOCS-004 | CLOSED — output schema expanded in DOCS-004 |
| G8 Cross-surface approval UX | UX+Eng | GO-005 | CLOSED — cross-surface approval clarified in GO-005 |
| G11 Hallucination detector approach | AI Lead | quality metric | CLOSED — detector approach noted in §15.3 |

**Exit:** 4 journeys (§9) pass acceptance; G1/G8 closed; D1 named.

## Gate 2 — Pro Packaging (Phase 2)
| Decision | Owner | Blocks | Status |
|----------|-------|--------|--------|
| D2 Pricing & fair-use limits | Product+Finance | commercial | OPEN |
| D3 Plagiarism model (incl/add-on/partner) | Product | WRITE-011 | OPEN |
| G5 Pro MCP trial vs Business admin | Product | DOCS-013 | CLOSED — §11 MCP row updated to "Limited trial" for Pro |
| G2 Simulation-replay UX | UX | automations | CLOSED — AUTO-002 simulation replay noted |

## Gate 3 — Business Collaboration (Phase 3)
| Decision | Owner | Blocks | Status |
|----------|-------|--------|--------|
| D5 Pro shared-mail collab | Product | MAIL-016 | OPEN |
| D6 Custom domains start tier | Product | DOCS-012 | OPEN |
| D7 Collab engine final | Arch | DOCS-011 | OPEN (from Gate 0) |
| G12 Estimate-disclosure FR (ROI/comm-score) | Legal+Product | TEAM-003/004 | CLOSED — estimate-disclosure added to TEAM-003/004 |

## Gate 4 — Enterprise (Phase 4)
| Decision | Owner | Blocks | Status |
|----------|-------|--------|--------|
| D10 Enterprise regions & compliance | Sales+Legal | TEAM-005 | OPEN |

## Non-blocking
- D4 Launch-quality languages — verify per-language in Phase 1.

## Escalation rule
Any OPEN item in Gate N that is not closed by Gate N exit → blocks Phase N+1 start. High-severity GA items (G9, G13, G14) are hard gates.
