# Rollback plan

Use this plan when a desktop release or backend deployment risks data integrity, security, or availability. The incident commander owns the decision and records the release identifier, start time, scope, and customer impact.

## Desktop update-channel rollback

1. **Stop promotion.** Disable automatic promotion from canary/beta to stable and halt any in-progress publishing workflow. Preserve the affected build, updater manifest, logs, and signing evidence for investigation.
2. **Assess and contain.** Identify the affected OS, architecture, version range, and failure mode. If the issue can affect data or credentials, block the version from update eligibility before investigating further.
3. **Repoint the channel.** Publish a signed update manifest that selects the last known-good version for the affected channel and platform. Never alter an existing signed installer in place or reuse a version number.
4. **Recover clients.** For clients that installed the bad build, surface an in-app recovery notice or support instructions for reinstalling the last known-good signed installer. Preserve the local data directory unless the incident procedure explicitly requires removal.
5. **Verify.** Install the replacement on each affected reference environment, verify launch, authentication, sync, approval, and update checks, then monitor crash and update-success rates for at least one release-monitoring window.
6. **Communicate.** Update the status page, support guidance, and release notes with affected versions, workaround, and recovery status. Promote again only after incident review approval.

Channel policy: canary is the first rollback target, beta is promoted only after canary health checks, and stable changes only after beta verification. Keep at least one prior signed installer and its manifest available for every supported platform.

## Backend deployment rollback

1. **Declare and freeze.** Stop deploys, assign an incident commander, and capture the deployment SHA, environment, feature-flag state, migration IDs, error rate, and request traces without secrets.
2. **Reduce blast radius.** Disable the implicated feature flag, pause background workers or action dispatch if needed, and route traffic to the last healthy deployment. Prefer a flag or traffic rollback before a binary rollback when it restores safety.
3. **Rollback the application.** Deploy the prior known-good, compatible artifact through the normal deployment pipeline. Verify health checks, authentication, read paths, action idempotency, approval state, and queue drain before restoring traffic.
4. **Handle data safely.** Database migrations must be expand/contract and backward compatible. Do not automatically down-migrate destructive schema or data changes. Snapshot affected data, write a reviewed forward repair, and have an owner approve it before execution.
5. **Validate and monitor.** Compare error rate, latency, queue age, duplicate-action rate, and provider failures to the pre-deploy baseline. Reconcile actions created during the incident using idempotency keys and audit records.
6. **Close out.** Restore flags and traffic gradually, communicate resolution, retain incident evidence, and create corrective actions for the root cause.

## Rollback decision triggers

Immediately start containment for credential exposure, unauthorized data access, duplicate external actions, corrupted approval state, a sustained availability breach, or a material regression against the reference-environment baselines. The incident commander may roll back without waiting for a full root-cause analysis.
