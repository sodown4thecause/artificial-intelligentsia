# W7 — Metrics Taxonomy

Derived from PRD §15, §14.4, TEAM-002/003/004.

## North-star (§15.1)
| Metric | Category | Definition | Measured/Est. | Gap |
|--------|----------|-----------|---------------|-----|
| Weekly completed assisted workflows / active user | north-star | workflow producing user-accepted output or approved action w/o substantial rework | **Measured** (acceptance event) | define "substantial rework" threshold |

## Activation (§15.2)
| Metric | Category | Measured/Est. | Notes |
|--------|----------|---------------|-------|
| First connector completed | activation | Measured | |
| First document created/imported | activation | Measured | |
| First accepted writing suggestion | activation | Measured | acceptance event |
| First approved mail draft | activation | Measured | approval event |
| First completed Go task | activation | Measured | durable run completion |
| First enabled automation after dry-run | activation | Measured | dry-run→active promotion |

## Quality (§15.3)
| Metric | Category | Measured/Est. | Notes |
|--------|----------|---------------|-------|
| Suggestion acceptance rate | quality | Measured | |
| Draft acceptance w/ minor edits | quality | Measured | |
| Citation-open / citation-correction rate | quality | Measured | |
| Incorrect-action rate | quality | Measured | |
| Undo rate | quality | Measured | |
| Automation disablement after error | quality | Measured | |
| Memory correction/deletion rate | quality | Measured | |
| Hallucinated commitment rate (mail) | quality | Measured (needs detector) | hard to measure reliably |

## Reliability (§15.4)
| Metric | Category | Measured/Est. | Notes |
|--------|----------|---------------|-------|
| Durable run completion rate | reliability | Measured | |
| Connector sync success | reliability | Measured | |
| External action duplication rate | reliability | Measured (idempotency keys) | |
| Approval delivery success | reliability | Measured | |
| Crash-free desktop sessions | reliability | Measured | |
| Offline sync conflict rate | reliability | Measured | |

## Business (§15.5)
| Metric | Category | Measured/Est. | Notes |
|--------|----------|---------------|-------|
| Free→Pro conversion | business | Measured | |
| Pro→Business expansion | business | Measured | |
| Weekly retention | business | Measured | |
| Active connected services | business | Measured | |
| Paid-plan utilization | business | Measured | |
| Cost per completed workflow | business | **Estimated** (cost ÷ completions) | formula gap: allocate shared infra |

## Observability signals (§14.4)
agent run latency · model latency/usage · tool latency · connector latency/errors · approval wait time · retry counts · suggestion acceptance · automation success · undo/correction rates · memory retrieval/correction events. → all **Measured**.

## Surveillance-sensitive flags (TEAM-004)
- Effective Communication Score (TEAM-004): must be **explainable**, must **not** be a covert employee-performance score.
- TEAM-002 individual analytics: require policy controls; aggregate by default.
- Any per-user metric surfaced to managers → flag + require disclosure.

## Open data-source gaps
- "Estimated time saved" / ROI (TEAM-003): explicitly **estimated**, never presented as financial return — needs transparent assumption ledger.
- Hallucinated-commitment rate: no native signal; requires heuristic detector.
