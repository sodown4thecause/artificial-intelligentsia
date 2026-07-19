# W5 — Risk Register

Derived from PRD §18 plus inferred implicit risks (§12, §20, §5).

## PRD-listed risks (§18)
| ID | Description | Root cause | Mitigation | Affected |
|----|-------------|-----------|------------|----------|
| R1 | Scope too broad | tries to clone 4 categories at once | gate MVP to Go + core writing + Gmail + Calendar + basic Docs + safe approvals; treat matrix as multi-phase | Phase 1 |
| R2 | Native SDK pre-1.0 | immature platform | pin versions; isolate behind adapters; avoid experimental mobile; automated tests on all desktop OS; keep web fallback for auth/complex surfaces | Phase 0–5 |
| R3 | Eve APIs evolve fast | framework churn | domain tools independent of Eve registration; wrap session/approval/schedule; keep AI SDK 7 + Workflow boundaries; pin & test upgrades | Phase 0–5 |
| R4 | Email automation damages trust | auto-send risk | simulation + dry-run; approval for sends by default; clear explanations + undo; limit volume/recipients; escalate uncertainty | Phase 2 |
| R5 | AI false facts/commitments | model hallucination | ground in sources; highlight inserted dates/prices/promises; review high-impact; deterministic checks before approval | Phase 1+ |
| R6 | Memory incorrect/invasive | stale or over-broad memory | provenance + confidence; separate inferred vs confirmed; visible controls + deletion; exclude secrets by default | Phase 1+ |
| R7 | Team analytics → surveillance | individual scoring | aggregate by default; disclose collection + formulas; no hidden individual scoring; policy controls; estimates not objective | Phase 3 |

## Inferred implicit risks
| ID | Description | Root cause | Mitigation | Affected |
|----|-------------|-----------|------------|----------|
| R8 | Model cost/quality volatility | multi-model routing + provider outages | AI Gateway fallback + per-plan model policy (§12.3); route routine work to cheaper models | all |
| R9 | Connector reliability / token expiry | external OAuth dependencies | AUTO-005 health surface; reauth on scope expand (AUTO-004); Vercel Connect short-lived creds | Phase 1+ |
| R10 | CRDT/collaboration complexity | realtime multi-user edit | operation-based/CRDT model with attribution + permission-aware sync (§12.7); staged rollout in Phase 3 | Phase 3 |

## Classification
- **Blocking (must mitigate before MVP):** R2, R3, R5 (architectural + trust foundations).
- **Mitigable via gating:** R1, R4, R6, R7 (product/process controls).
- **Operational:** R8, R9, R10 (observability + fallback).
