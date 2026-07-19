# W4 — Trust & Permission Model

Derived from PRD §13, §7.2–7.6, §10.5–10.6, §5.

## 1. Permission classes (§13.1)
| Class | Definition | Default behavior |
|-------|-----------|------------------|
| Read-only | observation only | may run within granted scopes |
| Local reversible write | local change that can be undone | auto-approve only via explicit rule |
| External reversible write | external change that can be undone | preview + approval by default |
| External consequential write | external change with real-world effect | preview + approval by default |
| Destructive / irreversible | delete/publish/send/large change | explicit per-action approval; may be prohibited |

## 2. Approval-gating rules per class
- **Read-only** → within scope, no approval.
- **Local reversible** → auto-approve only if covered by an enabled, explicit rule (§7.6 progressive autonomy).
- **External reversible** → preview shown, approval required by default.
- **External consequential** → preview + approval required by default (sends, event creation, shared-data changes, high-cost automations — §7.3).
- **Destructive/irreversible** → explicit per-action approval; may be entirely prohibited (e.g. bulk delete, publish).

## 3. Secret-handling invariants (§13.2)
- Desktop credentials stored in OS credential service via Native SDK.
- Prefer short-lived service tokens.
- Never include access tokens in model prompts, logs, telemetry, memory, or user-visible errors.
- Redact secrets before persistence.
- Rotate/revoke compromised connector sessions.
- Connector tools receive only the credentials/context needed for that call (§12.4).

## 4. Audit-record field schema (§13.3)
```
actor
agent + version
trigger
inputs + source references
tools called
permissions used
approvals
external changes
output references
cost + duration
error + retry state
```
Sensitive content referenced by secure identifiers where full retention unnecessary.

## 5. Data-control workflows (§13.4)
Export · deletion · connector disconnection · memory deletion · workspace retention policies · account closure.

## 6. Automation model → permission-class mapping (§10.6)
| AUTO requirement | Maps to |
|------------------|---------|
| AUTO-001 (name/owner/trigger/cond/actions/exceptions/approval/spend/failure/notify/audit) | every automation carries its own permission + approval policy |
| AUTO-002 (modes: disabled/sim/dry-run/approval-required/active) | dry-run & simulation gates before active (mirrors §7.6 progressive autonomy) |
| AUTO-003 (safety controls: max actions/day/spend/hours/recipients/domains/prohibited/approvers) | bounds external consequential + destructive actions |
| AUTO-004 (least-privilege, read/write shown separately, reauth on scope expand) | connector secret boundary |
| AUTO-005 (connector health: status/last-sync/scopes/expiry/errors/reconnect) | observability of external writes |
