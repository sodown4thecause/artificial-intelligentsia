# Gate 1 evidence manifest (schema version 1)

The Gate 1 evidence manifest is a strict, versioned index of evidence for one Git commit. It is deliberately separate from the existing `native-build-evidence` and `desktop-package-smoke` payloads: those artifacts remain unchanged and are referenced by manifest entries.

## Version 1

A manifest has `schemaVersion: 1`, `gate: "gate-1"`, a generation timestamp, and a subject. A development subject has a commit and no frozen-candidate signatures. A `frozen-release-candidate` has the same exact lowercase 40-character commit SHA plus signed artifact digests; every referenced artifact must match one of those signed digests.

Every evidence entry records its category, provenance, result, timestamp, environment, subject commit, source references, artifact digest/media type/purpose, limitations, privacy metadata, and (only when failed) a failure. Privacy metadata includes classification, synthetic-data status, redaction status, access scope, and optional consent and retention references. Entries cannot mix commits or reuse artifact references or digests. Directory-package, installer, and signing/notarization entries explicitly bind their artifacts to a package digest.

Provider categories (`eve`, `ai-sdk-7`, `vercel-connect`, `gmail`, `calendar`, and credential round trips) require `live-provider` provenance. Human observation and sign-off require `human` provenance. Provider and human records must be redacted and use synthetic data or a documented consent reference. A manifest does not imply that planned categories are complete; use `blocked` plus limitations when evidence is pending.

Sources are repository-relative paths or credential-free HTTPS URLs only. Absolute paths, traversal, other URI schemes, URL userinfo, queries, and fragments are rejected.

Validate a manifest with:

```sh
npm run validate:gate-1-manifest -- examples/gate-1-evidence-manifest.development.json
```

The committed example is non-secret, illustrative development metadata. It references the current native-library and Windows directory-package artifact categories; it is not generated evidence or a release candidate.
