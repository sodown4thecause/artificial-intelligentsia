# Operations runbook

## First response

1. Open an incident, assign an incident commander and communications owner, and record UTC timestamps.
2. Protect people and data first: stop unsafe action dispatch, preserve audit logs, and do not paste tokens, user content, or secrets into tickets or chat.
3. Scope by release, tenant, provider, connector, action ID, and time range. State the customer impact and next update time.
4. Escalate immediately for security, data-access, or irreversible external-action risk; use the rollback plan when a release is implicated.

## Provider outage

- Confirm the provider status and distinguish provider errors from local authentication, DNS, or backend failures.
- Put provider-backed actions into a retriable paused state; do not retry non-idempotent operations without their idempotency key and current action status.
- Display a degraded-service notice with the provider and retry expectation. Continue safe read-only cached use where possible.
- Retry with bounded exponential backoff after recovery, reconcile queued actions against provider records, and close only when queues and error rates normalize.

## Connector expiry or revocation

- Detect the authorization failure, mark the connector unhealthy, and stop new actions for that connector.
- Prompt the user to reauthorize through the approved OAuth/device flow. Never request a credential in support channels.
- After reauthorization, verify the minimal granted scopes, refresh connector health, and retry only actions that are still valid and idempotent.
- If scopes changed or a tenant policy blocks reauthorization, retain audit evidence and escalate to connector support/engineering.

## Duplicate action

- Pause delivery for the affected action type and locate records by idempotency key, actor, target, and provider request ID.
- Determine whether the provider accepted one, multiple, or no requests before attempting remediation.
- Do not issue compensating actions automatically unless they are explicitly safe and approved. Obtain user/incident-commander approval for irreversible remediation.
- Correct the local state from the provider’s authoritative result, notify affected users, and create a regression test for the duplicate path.

## Stuck approval or run

- Inspect approval state transitions, worker heartbeat, queue age, lease/lock ownership, and the action audit trail.
- If a lease has expired, safely requeue only after confirming no active worker can complete the same idempotency key.
- If an approval is stale, return it to the approver or expire it according to policy; never silently approve it.
- Escalate when the run has an external side effect with an unknown final state. Reconcile with the provider before retrying.

## Data-access incident

- Immediately revoke affected sessions/tokens, disable the implicated connector or feature, and preserve immutable audit and access logs.
- Notify security and the incident commander; engage legal/privacy according to the response policy. Limit investigation access to the incident team.
- Determine affected identities, data classes, time range, exports, and downstream recipients. Do not delete evidence.
- Complete containment, required notifications, and a documented remediation plan before restoring access.

## Secret exposure

- Treat any exposed token, private key, password, webhook secret, or signed artifact credential as compromised.
- Revoke/rotate the secret at its issuer, invalidate sessions or signatures that depend on it, and update the secret store through the approved rotation process.
- Remove the value from logs, tickets, CI output, and source history only after revocation; coordinate history rewriting with security if necessary.
- Search for use of the compromised credential, validate replacement access, and document the exposure scope without reproducing the secret.

## Rollback

- Freeze promotion and identify the last known-good desktop or backend version.
- Follow [the rollback plan](rollback-plan.md), including channel manifest rollback for desktop releases and traffic/flag rollback for backend deployments.
- Verify recovery against the reference environments and reconcile queued actions before declaring the service healthy.

## Escalation

| Trigger | Escalate to | Target response |
| --- | --- | --- |
| Provider-wide outage or sustained connector failure | On-call engineering and provider support | Immediately |
| Duplicate or unknown external action state | On-call engineering and incident commander | Immediately |
| Data-access incident or secret exposure | Security, privacy/legal, and incident commander | Immediately |
| Release regression or failed rollback | Release owner and on-call engineering | Within 15 minutes |
| Customer-impacting stuck approval/run | On-call engineering | Within 30 minutes |

The incident commander owns external updates and closure. Every incident requires a timeline, impact statement, mitigation record, follow-up owner, and post-incident review proportional to severity.
