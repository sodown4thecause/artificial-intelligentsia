# Gate 1 evidence governance (engineering default)

This is the authoritative engineering-default policy enforced by schema version 1. It is not legal, privacy, compliance, or release approval. Security and the Release Owner review and approve (or revise) it in plan task 3.4.

## Controlled manifest fields

Every entry declares a classification, access scope, governance owner role, per-artifact storage, redaction profile/status, retention policy/expiry, legal-hold state, and lifecycle state. Values are closed enums in `src/evidence/gate-1-governance.ts`; unknown values fail validation. References must be repository-relative or credential-free HTTPS URLs.

| Evidence type | Minimum classification / access / owner | Storage and redaction | Retention and data basis |
| --- | --- | --- | --- |
| native-library | internal / maintainers / maintainers | repository, CircleCI, or encrypted store; `none` | `ci-30d` or `internal-90d`; synthetic |
| desktop-directory-package | confidential / release-engineering or security-release / either | CircleCI or encrypted store; GitHub Release only package/signature; `none` | `release-365d` or `release-lifetime`; synthetic |
| installer | confidential / release-engineering or security-release / either | CircleCI or encrypted store; GitHub Release only package/signature; `none` | `release-365d` or `release-lifetime`; synthetic |
| credential-round-trip | restricted / security-release / security-release | encrypted store only; `gate1-secrets-v1` | `ci-30d`; synthetic metadata only, never credential values |
| signing-notarization | confidential / release-engineering or security-release / either | CircleCI or encrypted store; GitHub Release only package/signature; `none` | `release-365d` or `release-lifetime`; synthetic |
| cold-start | internal / maintainers / maintainers | repository, CircleCI, or encrypted store; `none` | `ci-30d` or `internal-90d`; synthetic |
| durable-resume | internal / maintainers / maintainers | repository, CircleCI, or encrypted store; `none` | `ci-30d` or `internal-90d`; synthetic |
| language-quality | internal / maintainers / maintainers | repository, CircleCI, or encrypted store; `none` | `ci-30d` or `internal-90d`; synthetic |
| product-journey | internal / maintainers / maintainers | repository, CircleCI, or encrypted store; `none` | `ci-30d` or `internal-90d`; synthetic |
| eve | restricted / security-release / security-release | encrypted store only; `gate1-provider-v1` | `ci-30d`; synthetic tenant or recorded consent |
| ai-sdk-7 | restricted / security-release / security-release | encrypted store only; `gate1-provider-v1` | `ci-30d`; synthetic tenant or recorded consent |
| vercel-connect | restricted / security-release / security-release | encrypted store only; `gate1-provider-v1` | `ci-30d`; synthetic tenant or recorded consent |
| gmail | restricted / security-release / security-release | encrypted store only; `gate1-provider-v1` | `ci-30d`; synthetic tenant or recorded consent |
| calendar | restricted / security-release / security-release | encrypted store only; `gate1-provider-v1` | `ci-30d`; synthetic tenant or recorded consent |
| human-observation | restricted / security-release / security-release | encrypted store only; `gate1-human-v1` | `human-90d`; consent and observed attestation |
| rollback | confidential / release-engineering or security-release / either | CircleCI or encrypted store; GitHub Release only package/signature; `none` | `release-365d` or `release-lifetime`; synthetic |
| sign-off | restricted / security-release / security-release | encrypted store only; `gate1-human-v1` | `release-365d` or `release-lifetime`; consent and approval/rejection attestation |

Public documentation and hashes may be public only when separately published as release-safe material; current evidence payloads are never less than internal. Repository/CircleCI use must follow existing `docs/runbook.md`, `docs/backup-restore.md`, telemetry redaction, `src/security/redaction.ts`, `src/core/redaction/secrets.ts`, and CircleCI secret rules. Access is least privilege, MFA-protected for restricted/release systems, and audit logged.

## Redaction, consent, and retention

Never record credentials, tokens, private keys, raw user or provider content, unredacted screenshots, secret-bearing URLs, or absolute paths. Run the applicable profile before storage, inspect the rendered output independently, and record only safe references and SHA-256 digests. Credential evidence is metadata-only. A provider’s non-synthetic tenant requires consent; human observation/sign-off always requires scoped consent/attestation. On withdrawal, stop collection, quarantine affected evidence, and delete it and derived copies unless an authorized hold requires preservation.

Retention begins at `recordedAt`. `ci-30d`, `internal-90d`, `human-90d`, and `release-365d` require `retentionUntil` after that timestamp; an active passed record past expiry is rejected. A hold on an expiring record needs an extension reference. `release-lifetime` has no expiry or hold and is prohibited for restricted raw traces and human observations. Incident retention has no ordinary expiry and requires a legal hold or documented incident/retention reference.

## Lifecycle, deletion, and incidents

`active` needs accessible safe artifact references. `quarantined` uses incident-response access, encrypted storage, incident retention, an incident reference, and cannot close the gate. `deleted` needs a UTC deletion time and safe deletion-receipt reference, cannot close the gate, and remains only as a digest-bound tombstone.

At expiry or withdrawal, inventory the primary and derived copies, delete CircleCI artifacts/logs, GitHub artifacts/releases as applicable, encrypted-store objects, local staging, caches, and reports; then record a safe receipt (without sensitive paths or content). This task defines no deletion API or access-provisioning mechanism.

On suspected exposure, stop promotion and quarantine the record; rotate/revoke credentials using the established security process; preserve the immutable original only in the authorized incident store; produce redacted investigation copies; and maintain chain of custody (actor, timestamp, digest, reference, and action). Restart collection/promotion only after containment, revocation/rotation, redaction verification, retention decision, and Security/Release Owner authorization.

See [the evidence manifest format](gate-1-evidence-manifest.md) and [Gate 1 closure](gate-1-closure.md). The manifest validator and this document are engineering controls pending task 3.4 review.
