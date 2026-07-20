# Red-team security tests

These release-blocking tests cover SEC-05 adversarial scenarios: prompt injection, secret exfiltration, unapproved consequential writes, and workspace isolation.

## Run

```bash
npm run test:redteam
npm run typecheck
```

Run these commands in CI before releasing. A failing red-team test must block the release until the security regression is resolved.

## Suites

- `prompt-injection.test.ts` tests instruction overrides, privilege escalation, and secret-bearing errors.
- `exfiltration.test.ts` tests outbound search, export, and tool-output exfiltration paths.
- `unsafe-writes.test.ts` tests the requirement for approval bound to the workspace and action.
- `cross-workspace.test.ts` tests isolation of memories, documents, and audit logs.
