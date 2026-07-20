# D7: Collaborative Document Engine

**Status:** Deferred to Phase 3

## Decision

Defer selection of the collaborative-document engine until before the Phase 3 kickoff. This decision blocks only `DOCS-011`; it does not block Phases 0–2 or the foundational document model needed before then.

## Context

Real-time collaboration introduces a distinct synchronization, conflict-resolution, presence, offline, authorization, and operational-support surface. Deferring the engine selection preserves the option to validate the document model and access-control boundaries first, while avoiding premature commitment to an internal implementation or external CRDT provider.

The Phase 3 scope that contains collaborative documents requires a final D7 decision before implementation begins. The Architecture owner must record the selected option, rationale, migration approach, and operating model in this document before the Phase 3 kickoff.

## Evaluation Criteria

Evaluate each option against the following criteria:

- Correctness of concurrent editing, conflict resolution, offline recovery, and reconnection behavior.
- Compatibility with the Creature document schema, structured objects, permissions, audit requirements, and AI-proposed edits.
- Support for presence, cursors, comments, shared drafts, and future cross-surface collaboration needs.
- Security posture, tenant isolation, data residency, credential handling, and access revocation behavior.
- Operational maturity: observability, debugging, incident recovery, backups, retention, and vendor availability commitments.
- Native desktop and web interoperability, including performance and stability on supported platforms.
- Delivery cost, total cost of ownership, vendor lock-in, licensing, team expertise, and an exit or migration path.

## Options to Evaluate

| Option | Description | Evaluation focus |
|---|---|---|
| Internal CRDT | Build and operate a Creature-owned CRDT synchronization service. | Maximum control and tailored data model versus engineering and operational cost. |
| Yjs | Adopt Yjs with an appropriate persistence and synchronization provider. | Ecosystem fit, editor bindings, persistence model, and ownership boundaries. |
| Automerge | Adopt Automerge for local-first collaborative data synchronization. | Local-first behavior, document-model fit, performance, and operational integration. |
| Liveblocks | Use Liveblocks collaboration infrastructure and CRDT/presence capabilities. | Managed-service fit, security controls, cost, and portability. |
| Other managed CRDT service | Evaluate a comparable managed provider if it better satisfies the criteria. | Evidence of material advantage over the listed options and a viable exit strategy. |

## Deadline and Ownership

- **Owner:** Architecture
- **Deadline:** Before Phase 3 kickoff
- **Gate:** Gate 3 — Business Collaboration
- **Blocking scope:** `DOCS-011` only

## Exception Note

PRD §19 lists D7 as architecture-blocking before Phase 0. This document records the approved exception: the operative tracker, [`spec/decision-gates.md`](../decision-gates.md) line 10, explicitly marks D7 as "OPEN (defer to Phase 3)" and identifies Phase 3 `DOCS-011` as its sole blocker. The repository gate tracker therefore governs scheduling until this exception is revisited or closed.

## References

- PRD §12.7, “Collaboration and sync”
- PRD §19, D7
- [`spec/decision-gates.md`](../decision-gates.md), Gate 0 and Gate 3
