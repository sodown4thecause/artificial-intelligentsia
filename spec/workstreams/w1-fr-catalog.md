# W1 — Functional Requirements Catalog

Normalized catalog of every numbered requirement in `prd/CREATURE_PRD_EVE_NATIVE_SDK.md` §10. IDs are the canonical source of truth for traceability.

## Go Agent (§10.1)
| ID | Module | Capability | Key sub-features | Constraints | Tier hint |
|----|--------|-----------|------------------|-------------|-----------|
| GO-001 | Go Agent | Streaming AI chat | temp/saved convo, attach files, reference mail/docs/people/events/DB, convert to background task, resume durable session, branch convo | must support streaming + multi-source context | Pro/Business/Enterprise |
| GO-002 | Go Agent | Durable background runs | 7 run states, step checkpoints, retry/resume, partial outputs, cancel, expiry/cleanup | must survive app close/connectivity loss | all tiers (quota varies) |
| GO-003 | Go Agent | Inline suggestions | contextual suggestions in own editors | no unsupported injection; system-wide later w/ OS perms | all tiers |
| GO-004 | Go Agent | Agent catalogue | first-party/partner/workspace agents, MCP tools, skills | disclose perms/data/publisher/version/update | Pro+ |
| GO-005 | Go Agent | Plans & approvals | execution preview: actions, systems, cost range, approvals | required before high-impact task | all tiers |
| GO-006 | Go Agent | Research & citations | distinguish source-backed / user / inference / recommendation | every source-backed claim links to source | all tiers |
| GO-007 | Go Agent | Task inbox | runs needing input, approvals, failures, completed, summaries, next actions | — | all tiers |

## Writing (§10.2)
| ID | Module | Capability | Key sub-features | Constraints | Tier hint |
|----|--------|-----------|------------------|-------------|-----------|
| WRITE-001 | Writing | Correctness | spelling/grammar/punctuation/caps/usage | — | all |
| WRITE-002 | Writing | Tone detection | confidence/formality/warmth/directness/urgency/ambiguity | framed as estimates, not judgments | all |
| WRITE-003 | Writing | Tone suggestions | targeted edits toward selected tone | preserve meaning | Limited→Unlimited |
| WRITE-004 | Writing | Sentence/paragraph rewrites | clarity/concision/fluency/simplify/expand/pro/professional/friendly/persuasive/custom | preserve names/numbers/citations/links/terms | Limited→Unlimited |
| WRITE-005 | Writing | Inclusivity | flag exclusionary wording + alternatives | admin-configurable/disable categories | Basic→Full |
| WRITE-006 | Writing | Citation formatting | APA/MLA/Chicago/linked-source | never fabricate fields; mark missing | Limited→Full/custom |
| WRITE-007 | Writing | On-demand composition | from prompts/outlines/docs/threads/sources/templates | — | Limited→Pooled |
| WRITE-008 | Writing | Translation | ≥17 languages translate, ≥24 rewrite; config-driven | subject to verified model quality | Limited→Unlimited |
| WRITE-009 | Writing | Proofreader agent | full-doc review, group issues, explain, batch-accept by category | — | Limited docs→Unlimited |
| WRITE-010 | Writing | AI detection | probability range + uncertainty | non-definitive warning; not sole basis for decisions | Limited→Included+audit |
| WRITE-011 | Writing | Plagiarism | match detection, show source, distinguish quote/citation/common/overlap | never label plagiarism from score alone | Trial/add-on→Contracted |
| WRITE-012 | Writing | Style guide | preferred/prohibited terms, caps, product names, formatting, voice, examples, exceptions | — | None→Unlimited |
| WRITE-013 | Writing | Brand tones | reusable tones from examples; versioned | changes must not silently alter approved content | 1→Unlimited |
| WRITE-014 | Writing | Knowledge Share & snippets | permissioned snippets/knowledge, manual or contextual | — | Personal→Governed |

## Mail (§10.3)
| ID | Module | Capability | Key sub-features | Constraints | Tier hint |
|----|--------|-----------|------------------|-------------|-----------|
| MAIL-001 | Mail | Provider scope | Gmail/Google Workspace MVP; Outlook later | — | — |
| MAIL-002 | Mail | Ask AI | questions on msg/thread/sender/label/range/mailbox | cite messages; respect perms | Basic→Full |
| MAIL-003 | Mail | Write with AI | draft using thread/instructions/voice/style/docs | — | Basic→Full |
| MAIL-004 | Mail | Instant Reply | concise reply options | review before send unless admin-approved narrow auto-send | all |
| MAIL-005 | Mail | Instant Event | extract event from email → calendar preview | confirm before create/invite | all |
| MAIL-006 | Mail | Auto Drafts | rule/priority/sender/intent drafts | never imply sent | Low→Unlimited |
| MAIL-007 | Mail | Auto Archive | rule-based archive | historical sim + dry-run before activation | Low→Contracted |
| MAIL-008 | Mail | Auto Labels | deterministic/agent/hybrid labels | user can inspect why applied | Low→Contracted |
| MAIL-009 | Mail | Auto Reminders | commitments/follow-ups/unanswered/due | confirm unless enabled rule | Low→Contracted |
| MAIL-010 | Mail | Auto Summarize | thread/inbox summaries | preserve open Qs/decisions/commitments/owners/dates | Low→Contracted |
| MAIL-011 | Mail | Autocorrect/autocomplete | low-latency compose assist | must not insert facts/commitments | all |
| MAIL-012 | Mail | Split Inbox | configurable sections | — | Basic→Full |
| MAIL-013 | Mail | Productivity | snippets/remind/snooze/unsub/read-status/quote/offline/recent | disclose read-status limits | Basic→Full |
| MAIL-014 | Mail | CRM integrations | HubSpot/Salesforce/Pipedrive read-only | writes need separate perms/preview/audit | None→Included |
| MAIL-015 | Mail | Calendar/scheduling | view/availability/find-time/preview/meeting links | — | Basic→Full |
| MAIL-016 | Mail | Team collaboration | shared convo/comments/drafts/read-status/reply/ownership/scheduling | internal comments never in external replies | Business+ |

## Docs (§10.4)
| ID | Module | Capability | Key sub-features | Constraints | Tier hint |
|----|--------|-----------|------------------|-------------|-----------|
| DOCS-001 | Docs | Pages/objects | text/headings/lists/tasks/callouts/tables/media/files/embeds/refs/objects | — | Limited→Unlimited |
| DOCS-002 | Docs | Docs AI assistant | Q&A/draft/summarize/rewrite/extract/compare/structure/citations/diff | large changes as reviewable diff | Limited→Included |
| DOCS-003 | Docs | Databases | fields/views/filters/sorts/group/relations/formulas/perms | schema must expand w/o migration-break | Limited beta→Included |
| DOCS-004 | Docs | AI views/pages | scope/prompt/schema/refresh/approval/source-vis | show gen time + records included | Limited→Included |
| DOCS-005 | Docs | Automations | triggers: record/schedule/form/mail/manual; actions: update/create/draft/notify/Eve | — | Low→Contracted |
| DOCS-006 | Docs | Attachments | limits/malware scan/type validation/secure links/retention | — | 1GB→Contracted |
| DOCS-007 | Docs | Connectors | manual/daily/hourly/enterprise-event refresh | — | Manual→Event-driven |
| DOCS-008 | Docs | Forms | unlimited responses; custom branding paid | — | Branded→Custom |
| DOCS-009 | Docs | Cross-doc | refs/tables/actions across docs | never reveal data viewer can't access | Limited→Governed |
| DOCS-010 | Docs | Version history | retention/named/compare/restore/attribution | — | 7d→Unlimited |
| DOCS-011 | Docs | Collaboration/sharing | realtime/share/synced/hidden/custom-dom/lock/adv-lock/deps | — | Basic→Advanced |
| DOCS-012 | Docs | Workspace org | folders/icons/folder-perms/search/doc+page analytics/domain capture | — | Basic→Advanced |
| DOCS-013 | Docs | MCP access | permissioned MCP server for docs/mail/tasks/tools | scoped tokens/perms/audit/admin | Trial→Contract |

## Memory & Knowledge (§10.5)
| ID | Module | Capability | Key sub-features | Constraints | Tier hint |
|----|--------|-----------|------------------|-------------|-----------|
| MEM-001 | Memory | Mnemosyne ownership | indexing/retrieval/consolidation/lifecycle/deletion | Eve must not build competing hidden store | all |
| MEM-002 | Memory | Memory types | personal voice/comm/project/terminology/procedures/relationship | separately scoped | all |
| MEM-003 | Memory | Memory controls | review/correct/pin/scope/disable/delete/export/disable-all | — | all |
| MEM-004 | Memory | Canonical-source boundary | must not replace email/docs/DB/audit/approval/git/secrets | — | all |
| MEM-005 | Memory | Sensitive memory | no retention w/o explicit action + need | credentials/tokens/keys prohibited | all |

## Automations & Connectors (§10.6)
| ID | Module | Capability | Key sub-features | Constraints | Tier hint |
|----|--------|-----------|------------------|-------------|-----------|
| AUTO-001 | Automations | Automation model | name/owner/trigger/cond/actions/exceptions/approval/spend/failure/notify/audit | — | all |
| AUTO-002 | Automations | Modes | disabled/simulation/dry-run/approval-required/active | — | all |
| AUTO-003 | Automations | Safety controls | max actions/day/spend/hours/recipients/domains/prohibited/approvers | — | all |
| AUTO-004 | Automations | Connector permission model | least privilege; read/write shown separately; reauth on scope expand | — | all |
| AUTO-005 | Automations | Connector health | status/last-sync/scopes/expiry/errors/reconnect | — | all |

## Team & Administration (§10.7)
| ID | Module | Capability | Key sub-features | Constraints | Tier hint |
|----|--------|-----------|------------------|-------------|-----------|
| TEAM-001 | Team | Roles | Owner/Admin/Member/Guest/custom Enterprise | — | all |
| TEAM-002 | Team | Analytics | adoption/active/tasks/time/accept/reject/automation/suggestions/time-saved/rework | measured vs estimated | Personal→Governed |
| TEAM-003 | Team | ROI report | periodic, transparent assumptions | not exact financial return | Business+ |
| TEAM-004 | Team | Effective Communication Score | configurable dimensions | explainable; not covert perf score | Business+ |
| TEAM-005 | Team | Enterprise controls | SSO/SCIM/domain-capture/RBAC/audit-export/retention/legal-hold/model+connector+agent+MCP allowlists/regional/CMEK/support | — | Enterprise |

## Security (§13)
| ID | Module | Capability | Key sub-features | Constraints | Tier hint |
|----|--------|-----------|------------------|-------------|-----------|
| SEC-001 | Security | Secret isolation | connector tokens/keys never in prompts/logs/telemetry/memory | must pass automated red-team validation | all |

**Total: 66 numbered requirements** (7 + 14 + 16 + 13 + 5 + 5 + 5 + 1).
