# W2 — Plan-Packaging Matrix

Entitlement mapping joining PRD §11 (packaging matrix) to FR IDs from W1. Quota types: unlimited / quota / pooled / contracted / add-on / trial.

## Tier legend
F=Free, P=Pro, B=Business, E=Enterprise. "—" = not included.

| Capability (FR anchor) | F | P | B | E | Join key |
|---|---|---|---|---|---|
| Go AI chat (GO-001) | beta/fair-use | +priority | +workspace ctrl | contractual | GO-001 |
| Durable background tasks (GO-002) | low | med | high pooled | contracted | GO-002 |
| Inline suggestions (GO-003) | ✓ | ✓ | ✓ | ✓ | GO-003 |
| Connector/partner agents (GO-004) | beta cat | full | full+admin | private cat | GO-004 |
| Correctness (WRITE-001) | ✓ | ✓ | ✓ | ✓ | WRITE-001 |
| Tone detection (WRITE-002) | ✓ | ✓ | ✓ | ✓ | WRITE-002 |
| Tone suggestions (WRITE-003) | limited | unlim | unlim | unlim | WRITE-003 |
| Rewrites (WRITE-004) | limited | unlim | unlim | unlim | WRITE-004 |
| Inclusivity (WRITE-005) | basic | full | config | policy | WRITE-005 |
| Citation format (WRITE-006) | limited | full | full | full+custom | WRITE-006 |
| AI composition (WRITE-007) | limited | higher | pooled | contracted | WRITE-007 |
| Translation (WRITE-008) | limited | unlim | unlim | unlim | WRITE-008 |
| Paragraph rewrites (WRITE-004) | limited | unlim | unlim | unlim | WRITE-004 |
| Proofreader (WRITE-009) | limited docs | unlim | unlim | unlim | WRITE-009 |
| AI detection (WRITE-010) | limited | inc | inc+ctrl | inc+audit | WRITE-010 |
| Plagiarism (WRITE-011) | trial/add-on | add-on | inc/pooled | contracted | WRITE-011 |
| Style guides (WRITE-012) | — | 1 | unlim | unlim+inherit | WRITE-012 |
| Brand tones (WRITE-013) | 1 personal | 1 | unlim | unlim+appr | WRITE-013 |
| Knowledge Share (WRITE-014) | personal | inc | shared | governed | WRITE-014 |
| Snippets (WRITE-014) | personal | personal | shared lib | governed | WRITE-014 |
| Analytics (TEAM-002) | personal | personal prod | team | team+indiv policy | TEAM-002 |
| Mail AI (MAIL-002/003) | basic | full | full | full+policy | MAIL-002/003 |
| Auto Drafts/Labels/Archive/Reminders (MAIL-006/007/008/009) | low | med | unlim policy | contracted | MAIL-006..009 |
| Split Inbox (MAIL-012) | basic | full | full | full | MAIL-012 |
| CRM read-only (MAIL-014) | — | optional | inc | inc+gov | MAIL-014 |
| Calendar (MAIL-015) | basic | full | full | full | MAIL-015 |
| Shared mail collab (MAIL-016) | — | —/trial | inc | inc | MAIL-016 |
| Pages/objects (DOCS-001) | limited shared | unlim | unlim | unlim | DOCS-001 |
| Docs AI (DOCS-002) | limited trial | inc | inc | inc | DOCS-002 |
| Databases (DOCS-003) | limited beta | inc | inc | inc | DOCS-003 |
| AI views (DOCS-004) | limited trial | inc | inc | inc+policy | DOCS-004 |
| Automations (DOCS-005/AUTO) | low | med | unlim fair-use | contracted | DOCS-005 |
| Attachments (DOCS-006) | 1GB/doc | 5GB/doc | high/pooled | contracted | DOCS-006 |
| Connector refresh (DOCS-007) | manual | daily | hourly | hourly/event | DOCS-007 |
| Forms (DOCS-008) | branded | custom | custom | custom+domain | DOCS-008 |
| Cross-doc (DOCS-009) | limited tables | tables | tables+actions | governed actions | DOCS-009 |
| Version history (DOCS-010) | 7d | 30d | unlim | unlim+retention | DOCS-010 |
| Desktop app | ✓ | ✓ | ✓ | managed | §12.1 |
| Mobile app | — | later | later | managed later | §5 |
| MCP (DOCS-013) | limited trial | inc | admin ctrl | allowlisted | DOCS-013 |
| Real-time collab (DOCS-011) | basic | inc | inc | inc | DOCS-011 |
| Custom domains (DOCS-012) | — | optional | inc | inc | DOCS-012 |
| Locking (DOCS-011) | basic | inc | advanced | policy-enforced | DOCS-011 |
| Folder access (DOCS-012) | basic | inc | advanced | custom roles | DOCS-012 |
| Domain capture | — | — | optional | inc | TEAM-005 |
| SSO/SCIM/audit/retention (TEAM-005) | — | — | optional add-on | inc | TEAM-005 |

**Fair-use caveat (§11):** "Unlimited" always subject to abuse prevention + infra protection + disclosed fair-use.

## Coverage check
All 65 FRs from W1 have at least one packaging row. ✅
