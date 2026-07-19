# Creature — AI-Native Work Operating System

**Product Requirements Document**  
**Status:** Revised Draft 1.1  
**Target platform:** Native desktop application  
**Primary stack:** Vercel Eve, Vercel AI SDK 7, Vercel AI Gateway, Vercel Connect, Native SDK, Mnemosyne  
**Initial platforms:** Windows, macOS, Linux  
**Product model:** Free, Pro, Business, Enterprise  
**Pricing:** To be determined; this document defines packaging and entitlements, not prices.

## Changelog
- **Revised Draft 1.1 (2026-07-19):** Incorporated spec gap analysis (G1-G14). Added SEC-001 secret-isolation FR in §13.2. Added AI-view output schema to DOCS-004. Added simulation replay to AUTO-002. Added deny-listing to AUTO-004. Added cross-surface approval to GO-005. Updated §15 metrics with hallucination detector and cost allocation notes. Added estimate-disclosure to TEAM-003/004. Marked D7/D8/D9 as architecture-blocking in §19. Updated §20 technical-assumption validation status. Changed Pro MCP to "Limited trial" in §11 packaging matrix. Updated companion spec files with closure statuses.

---

## 1. Executive summary

Creature is an AI-native work operating system that combines four product categories in one desktop application:

1. A durable personal work agent that can answer questions, carry out multi-step tasks, and continue work in the background.
2. A writing assistant for correction, rewriting, tone, translation, citations, and organization-specific language.
3. An intelligent email and calendar client with drafting, summarization, prioritization, reminders, and safe automation.
4. A collaborative documents and structured-data workspace with pages, databases, forms, cross-document references, and automations.

The product is built as a native desktop client using Native SDK. Vercel Eve runs the durable agent backend, including tools, skills, subagents, schedules, approvals, retries, and resumable sessions. AI SDK 7 provides model and tool abstractions. AI Gateway provides model routing, fallbacks, observability, and spend controls. Vercel Connect manages external service connections. Mnemosyne owns durable memory and preference learning.

Creature is not intended to clone Grammarly, Superhuman, Coda, or Notion feature-for-feature. It uses the strongest workflows from those categories to create a unified system in which the agent understands the user's writing, inbox, documents, tasks, calendar, connected applications, and team rules.

---

## 2. Problem statement

Knowledge workers currently split work across separate writing assistants, email clients, document systems, calendars, automation tools, and general-purpose AI chats. Each product maintains incomplete context and requires the user to repeatedly explain goals, terminology, writing style, projects, and relationships.

Existing AI features are commonly limited in one or more ways:

- They operate only inside one application.
- They generate text but cannot complete durable workflows.
- They lack reliable approval boundaries for destructive or external actions.
- They do not retain structured, user-controlled memory across work surfaces.
- They cannot explain what an automation did, why it acted, or how to undo it.
- Their collaboration and governance controls are separate from the AI system.
- Background agents, writing assistance, email automation, and documents remain disconnected.

Creature solves this by providing one native workspace and one durable agent layer across communications, documents, knowledge, and connected tools.

---

## 3. Product vision

Creature should become the default desktop workspace for individual professionals and small teams who want AI to perform useful work rather than merely produce chat responses.

A user should be able to:

- Ask Creature to prepare, investigate, draft, organize, schedule, or follow up.
- See the exact sources, tools, permissions, and changes involved.
- Allow safe routines to run automatically while keeping risky actions approval-gated.
- Write consistently in their own voice or an approved team voice.
- Manage email, calendar, documents, and connected data without switching between multiple products.
- Resume long-running work after closing the application or changing devices.
- Inspect, edit, retry, pause, or undo agent activity.

The product should feel like a native work environment with an embedded agent, not a website wrapped in a desktop shell.

---

## 4. Goals

### 4.1 Primary goals

- Deliver a fast native desktop application for Windows, macOS, and Linux.
- Make AI chat actionable through durable tools, approvals, schedules, and background execution.
- Provide high-quality writing assistance within Creature and through approved operating-system integrations.
- Make Gmail and Google Calendar the first complete communication integration.
- Provide a lightweight but extensible document and structured-data system.
- Build explicit user trust through previews, approvals, audit trails, undo support, and clear automation status.
- Support individual use first, followed by team collaboration, shared knowledge, administration, and enterprise governance.
- Use one memory layer for approved preferences and context without treating memory as the canonical source of truth.

### 4.2 Business goals

- Create a compelling free product that demonstrates the integrated workflow.
- Make Pro valuable through higher AI limits, advanced writing, full mail productivity, and richer documents.
- Make Business valuable through shared work, organization context, analytics, automation, and administrative controls.
- Make Enterprise valuable through identity, governance, security, auditability, deployment controls, and support.

### 4.3 Success definition

Creature succeeds when users complete meaningful writing, mail, research, scheduling, and document tasks with less application switching and less manual rework, while retaining confidence in every agent action.

---

## 5. Non-goals

The first release will not:

- Replace full office suites for spreadsheets, presentations, or advanced page layout.
- Provide unrestricted autonomous sending, deletion, purchasing, publishing, or external account changes.
- Train a proprietary foundation model.
- Build a complete customer relationship management platform.
- Support every email, calendar, storage, and messaging provider at launch.
- Guarantee complete system-wide writing assistance in every third-party application during the MVP.
- Ship production mobile applications during the desktop-first release.
- Treat AI detection as definitive proof that content was generated by AI.
- Replace canonical documents, email history, Git history, approval logs, or source-system records with agent memory.

---

## 6. Target users

### 6.1 Independent professional

Consultants, researchers, writers, marketers, creators, analysts, and technical solopreneurs who manage writing, email, documents, research, and scheduling themselves.

Primary needs:

- Faster drafting and rewriting.
- Inbox prioritization and follow-up.
- Durable research and work tasks.
- Personal voice and preference memory.
- Low setup burden.

### 6.2 Small team

Teams of 2–50 people that need shared documents, reusable knowledge, communication standards, mail collaboration, and agent-assisted workflows.

Primary needs:

- Shared drafts and comments.
- Team writing style and brand voice.
- Shared conversations and ownership.
- Workspace automations.
- Usage, quality, and outcome analytics.

### 6.3 Managed organization

Larger or regulated organizations that need centralized administration and controlled deployment.

Primary needs:

- SSO, SCIM, role-based access, audit logs, retention, legal holds, and export controls.
- Approved connectors, models, agents, and automations.
- Data residency and contractual controls.
- Organization-wide knowledge and policy enforcement.

---

## 7. Product principles

### 7.1 Native first

The desktop application must prioritize low latency, keyboard navigation, offline access, system notifications, secure credential storage, file interactions, and platform conventions.

### 7.2 Agent work must be inspectable

Every durable run must show:

- Current status.
- Plan or task stages.
- Tools and sources used.
- Pending approvals.
- Files or records changed.
- Model and cost information where permitted.
- Errors, retries, and recovery options.

### 7.3 Preview before impact

External or destructive actions must support preview and approval. Examples include sending mail, deleting or archiving large message sets, changing calendar events, publishing documents, modifying shared data, and running high-cost automations.

### 7.4 Memory is explicit and controllable

Users must be able to view, correct, pin, scope, export, and delete remembered preferences. Secrets must never be stored in memory.

### 7.5 One workspace, modular agents

Writing, mail, documents, and connectors should share a common agent runtime and permission model while remaining independently testable and replaceable.

### 7.6 Progressive autonomy

The product starts with suggestions and approvals. Automation expands only after the user has observed successful behavior and explicitly enabled a rule.

---

## 8. Core product surfaces

### 8.1 Home

A unified dashboard containing:

- Continue working.
- Pending approvals.
- Agent runs in progress.
- Inbox priorities.
- Upcoming calendar events.
- Recently edited documents.
- Suggested follow-ups.
- Automation health and failures.

### 8.2 Go Agent

A command and chat surface for direct questions, multi-step tasks, background work, and reusable agents.

### 8.3 Write

A focused editor and writing review surface with correction, transformation, translation, citations, team voice, and quality checks.

### 8.4 Mail

A Gmail-first email client with AI drafting, triage, automation, search, calendar actions, and team collaboration.

### 8.5 Docs

Pages, objects, databases, forms, attachments, cross-document references, AI views, and automations.

### 8.6 Automations

A rule builder and run history for scheduled, event-driven, and manually triggered workflows.

### 8.7 Connections and agents

A catalogue for first-party agents, partner agents, MCP servers, and service connectors.

### 8.8 Admin

Workspace members, roles, style guides, brand tones, knowledge sources, security, policies, usage, analytics, and audit logs.

---

## 9. Key user journeys

### 9.1 Turn an email request into completed work

1. Creature identifies an important request in the inbox.
2. The user asks the Go Agent to investigate it and prepare a response.
3. Eve starts a durable run and delegates research, document retrieval, and drafting to appropriate tools or subagents.
4. Creature creates a supporting document and a reply draft.
5. The user reviews sources and edits the draft.
6. Sending remains approval-gated.
7. Creature stores the approved communication preference in Mnemosyne when the user opts in.

### 9.2 Improve writing across a document

1. The user opens a document or pastes selected text into Write.
2. Creature identifies correctness, fluency, tone, inclusivity, and citation-format issues.
3. Suggestions are grouped by severity and category.
4. The user accepts an individual suggestion, accepts a category, or requests a full rewrite.
5. The final text remains editable and versioned.

### 9.3 Create an inbox automation safely

1. The user describes a rule in natural language.
2. Creature converts it into structured conditions, actions, exceptions, and an approval policy.
3. A preview shows messages that would have matched during a historical simulation.
4. The user enables the rule in dry-run mode.
5. Creature reports proposed actions without applying them.
6. The user promotes the rule to active mode.
7. Every run remains visible and reversible where the source system supports reversal.

### 9.4 Build a project workspace from connected sources

1. The user creates a project document.
2. They connect mail threads, calendar events, files, CRM records, and related documents.
3. Creature generates an AI view showing status, decisions, open questions, owners, and next actions.
4. The user can ask questions grounded in the connected records.
5. Citations open the canonical source.

---

## 10. Functional requirements

## 10.1 Go Agent

### GO-001: AI chat

The product must provide streaming AI chat with file, image, document, email, and connector context.

The user must be able to:

- Start a temporary or saved conversation.
- Attach local or connected files.
- Reference mail, documents, people, events, folders, and database records.
- Convert a conversation into a background task.
- Continue a previous durable session.
- Branch a conversation without changing the original.

### GO-002: Durable background runs

A task must continue after the desktop app closes, loses connectivity, or updates.

Each run must support:

- Queued, running, waiting, approval required, paused, failed, cancelled, and completed states.
- Step-level checkpoints.
- Retry and resume.
- Partial outputs.
- User cancellation.
- Expiry and cleanup policies.

### GO-003: Inline suggestions

Creature must support contextual suggestions inside its own editors at launch.

System-wide suggestions in third-party applications must be a later feature and require explicit operating-system permissions. The product must not use unsupported injection techniques or hidden accessibility access.

### GO-004: Agent catalogue

Users must be able to install and manage:

- First-party agents.
- Partner agents.
- Workspace agents.
- MCP-based tools and services.
- Reusable skills.

Each listing must disclose requested permissions, data access, external services, publisher, version, and update policy.

### GO-005: Plans and approvals

Before a high-impact task begins, Creature must show a concise execution preview containing intended actions, expected systems, estimated cost range where available, and required approvals. Cross-surface approvals must surface in the action's native surface while displaying the originating context. For example, when a Docs automation triggers a mail action, the approval request appears in Mail with a visible link to the originating Docs automation.

### GO-006: Research and citations

Research outputs must distinguish:

- Source-backed facts.
- User-provided information.
- Inferences.
- Agent recommendations.

Every source-backed claim must link to its source or source record.

### GO-007: Task inbox

Users must have a task inbox for:

- Runs requiring input.
- Approval requests.
- Failures.
- Completed work.
- Scheduled-run summaries.
- Suggested next actions.

---

## 10.2 Writing

### WRITE-001: Correctness suggestions

Detect and suggest corrections for spelling, grammar, punctuation, capitalization, and common usage problems.

### WRITE-002: Tone detection

Classify relevant tone characteristics such as confidence, formality, warmth, directness, urgency, and ambiguity.

Tone results must be framed as estimates, not objective judgments.

### WRITE-003: Tone suggestions

Suggest targeted edits to move text toward a selected tone without unnecessarily changing meaning.

### WRITE-004: Sentence and paragraph rewrites

Support:

- Clarity.
- Concision.
- Fluency.
- Simplification.
- Expansion.
- Professionalization.
- Friendly tone.
- Persuasive tone.
- User-defined instruction.

Rewrites must preserve names, numbers, citations, links, and protected terminology unless the user authorizes changes.

### WRITE-005: Inclusivity suggestions

Flag potentially exclusionary or inaccessible wording and provide context-sensitive alternatives. Workspace administrators must be able to configure or disable categories.

### WRITE-006: Citation-style formatting

Support configurable citation formats, initially including APA, MLA, Chicago, and a generic linked-source format.

Creature must not fabricate missing bibliographic fields. Missing information must be clearly marked.

### WRITE-007: On-demand composition

Generate drafts from prompts, outlines, documents, email threads, connected sources, or templates.

### WRITE-008: Translation

Support paragraph translation for an initial set of at least 17 languages and rewrite operations for an initial set of at least 24 languages, subject to verified model quality.

Language availability must be configuration-driven rather than hard-coded into product logic.

### WRITE-009: Proofreader agent

A dedicated proofreader agent must review an entire document, group issues, explain significant changes, and allow batch acceptance by category.

### WRITE-010: AI detection

AI detection may provide a probability range and uncertainty explanation. It must include a warning that the result is not definitive and must not be used as the sole basis for disciplinary, employment, academic, or legal decisions.

### WRITE-011: Plagiarism checking

The plagiarism checker must:

- Identify matching or closely similar passages.
- Show the comparison source.
- Distinguish quotation, citation, common phrasing, and likely unattributed overlap.
- Never label a user as having plagiarized solely from a similarity score.

### WRITE-012: Style guide

Workspace style guides must support:

- Preferred and prohibited terminology.
- Capitalization.
- Product names.
- Formatting rules.
- Voice instructions.
- Examples.
- Exceptions by team or document type.

### WRITE-013: Brand tones

Users must be able to define reusable tones from examples and explicit guidance. A brand tone must be versioned and changes must not silently alter previously approved content.

### WRITE-014: Knowledge Share and snippets

Users and teams must be able to create reusable, permissioned snippets and knowledge entries that can be inserted manually or recommended contextually.

---

## 10.3 Mail

### MAIL-001: Provider scope

The MVP must support Gmail and Google Workspace. Microsoft Outlook and Microsoft 365 must follow after Gmail workflows are stable.

### MAIL-002: Ask AI

Users must be able to ask questions about a message, thread, sender, label, time range, or mailbox selection.

Answers must cite the relevant messages and must respect mailbox and workspace permissions.

### MAIL-003: Write with AI

Creature must draft mail using:

- Current thread context.
- User-selected instructions.
- Approved personal voice preferences.
- Workspace style and brand tone.
- Relevant connected documents.

### MAIL-004: Instant Reply

Generate concise reply options for common intents. The user must review the selected response before sending unless an administrator-approved automation explicitly permits auto-send for a narrow scenario.

### MAIL-005: Instant Event

Extract proposed event details from an email and create a calendar-event preview. Creation or invitation sending must require confirmation.

### MAIL-006: Auto Drafts

Create reply drafts based on rules, priority, sender, thread state, or detected intent. Auto Drafts must never imply that a message was sent.

### MAIL-007: Auto Archive

Archive messages according to user-defined rules. New rules must support historical simulation and dry-run mode before activation.

### MAIL-008: Auto Labels and Custom Auto Labels

Apply system or user-defined labels using deterministic conditions, agent classification, or a hybrid rule. Users must be able to inspect why a label was applied.

### MAIL-009: Auto Reminders

Detect commitments, requested follow-ups, unanswered important messages, and due dates. Suggested reminders require confirmation unless covered by an enabled rule.

### MAIL-010: Auto Summarize

Generate summaries for long threads and selected inbox groups. Summaries must preserve unresolved questions, decisions, commitments, owners, and dates.

### MAIL-011: Autocorrect and autocomplete

Provide low-latency correction and completion in the compose editor. Completion must not insert unsupported facts or commitments.

### MAIL-012: Split Inbox

Provide configurable inbox sections using labels, sender groups, priority, detected intent, and custom rules.

### MAIL-013: Productivity features

Support:

- Snippets.
- Remind Me.
- Snooze.
- Unsubscribe assistance.
- Read statuses where supported and legally appropriate.
- Quick Quote.
- Offline access to cached messages and drafts.
- Recent Opens.

Read-status features must clearly disclose technical limitations and privacy implications.

### MAIL-014: CRM integrations

HubSpot, Salesforce, and Pipedrive integrations must be read-only initially. Any future writes require separate permissions, previews, audit logs, and approval policies.

### MAIL-015: Calendar and scheduling

Support:

- Calendar view.
- Availability sharing.
- Find Time.
- Event previews from email.
- Zoom, Google Meet, and Microsoft Teams meeting links.

### MAIL-016: Team collaboration

Business and Enterprise plans must support:

- Shared conversations.
- Internal comments.
- Shared drafts.
- Team read statuses.
- Reply indicators.
- Assignment and ownership.
- Team scheduling.

Internal comments must never be included in external replies.

---

## 10.4 Docs

### DOCS-001: Pages and objects

Users must be able to create pages containing text, headings, lists, tasks, callouts, tables, media, files, embeds, references, and structured objects.

### DOCS-002: Docs AI assistant

The Docs assistant must:

- Answer questions about the current document or selected workspace scope.
- Draft, summarize, rewrite, extract, compare, and structure content.
- Generate citations to canonical source blocks or connected records.
- Create proposed edits as a diff before applying large changes.

### DOCS-003: Databases

Provide structured collections with configurable fields, views, filters, sorts, grouping, relations, formulas, and permissions.

The initial database implementation may support a limited field and view set but must use a schema that can expand without migration-breaking redesign.

### DOCS-004: AI views and pages

Users must be able to define an AI-generated view with:

- Scope.
- Prompt or objective.
- Output schema (must support status, decisions, owners, next actions as output fields in addition to any user-defined schema).
- Refresh policy.
- Approval policy.
- Source visibility.

An AI view must show when it was generated and which records were included. The output schema must at minimum enumerate status, decisions, owners, and next actions derived from the scoped records.

### DOCS-005: Automations

Document automations must support triggers based on record changes, schedules, forms, mail, and manual actions.

Actions may include updating records, creating pages, drafting messages, notifying users, and starting Eve runs.

### DOCS-006: Attachments

Support attachments with plan-based limits, malware scanning, content-type validation, secure download links, and retention controls.

### DOCS-007: Connectors

Connected data must support plan-based refresh intervals:

- Manual refresh.
- Daily refresh.
- Hourly refresh.
- Enterprise-controlled refresh and event-driven sync where supported.

### DOCS-008: Forms

Forms must support unlimited responses subject to fair-use and abuse controls. Paid plans may remove Creature branding and use custom branding.

### DOCS-009: Cross-doc

Support references, tables, and actions across documents while enforcing source permissions.

A destination document must never reveal data the viewer cannot access in the source.

### DOCS-010: Version history

Support plan-based version retention, named versions, comparison, restoration, and agent-change attribution.

### DOCS-011: Collaboration and sharing

Support:

- Real-time collaboration.
- Document and folder sharing.
- Synced pages.
- Hidden pages.
- Custom domains.
- Page and document locking.
- Advanced locking.
- Enforced dependencies.

### DOCS-012: Workspace organization

Support unlimited folders on paid plans, custom icons, folder-level permissions, workspace search, document analytics, page analytics, and domain capture for managed organizations.

### DOCS-013: MCP access

Expose an optional permissioned MCP server for reading or acting on Creature documents, mail-derived objects, tasks, and approved workspace tools.

MCP access must use scoped tokens, explicit tool permissions, audit logs, and administrator controls.

---

## 10.5 Memory and knowledge

### MEM-001: Mnemosyne ownership

Mnemosyne owns memory indexing, retrieval, consolidation, lifecycle, and deletion.

Eve may request and use memory but must not implement a competing hidden memory store.

### MEM-002: Memory types

Support separately scoped memory for:

- Personal preferences.
- Writing voice.
- Communication preferences.
- Project context.
- Workspace terminology.
- Reusable procedures.
- Relationship context.

### MEM-003: Memory controls

Users must be able to:

- Review remembered items.
- Correct them.
- Pin them.
- Change scope.
- Disable categories.
- Delete individual items.
- Export all memory.
- Disable memory entirely.

These controls apply to all memory types, including communication preferences captured during mail and scheduling workflows.

### MEM-004: Canonical-source boundary

Memory must not replace:

- Original email.
- Canonical documents.
- Database records.
- Audit logs.
- Approval records.
- Git history.
- Credentials or secrets.

### MEM-005: Sensitive memory

Sensitive information must not be retained without explicit user action and a defined product need. Credentials, access tokens, private keys, and authentication material are prohibited from memory storage.

---

## 10.6 Automations and connectors

### AUTO-001: Automation model

Every automation must contain:

- Name and owner.
- Trigger.
- Conditions.
- Actions.
- Exceptions.
- Approval policy.
- Spend or run limit.
- Failure behavior.
- Notification policy.
- Audit history.

### AUTO-002: Modes

Support disabled, simulation, dry-run, approval-required, and active modes. In simulation mode, historical replay must show which messages or records would have matched the conditions during the replay period.

### AUTO-003: Safety controls

Users and administrators must be able to define:

- Maximum actions per run.
- Maximum daily actions.
- Maximum model spend.
- Permitted hours.
- Allowed recipients and domains.
- Prohibited labels, folders, documents, or systems.
- Required approvers.

### AUTO-004: Connector permission model

Connections must request the least privilege needed. Read and write permissions must be shown separately. Reauthorization must be required when scopes expand. Connections operate in a default-deny stance: they must be explicitly enabled. Administrators may maintain prohibited-connector lists.

### AUTO-005: Connector health

The product must show connection status, last successful sync, scopes, token expiry state, errors, and reconnect actions.

---

## 10.7 Team and administration

### TEAM-001: Roles

At minimum support Owner, Administrator, Member, Guest, and custom Enterprise roles.

### TEAM-002: Analytics

Analytics must cover:

- Adoption.
- Active users.
- Agent tasks completed.
- Time-to-completion.
- Acceptance and rejection rates.
- Automation success and failure.
- Writing suggestion categories.
- Estimated time saved.
- Rework and undo rates.

Metrics must distinguish measured events from estimates.

### TEAM-003: ROI report

Business and Enterprise plans may generate a periodic ROI report based on transparent assumptions and observable activity. The report must not present estimated time savings as exact financial return. Any metric labeled "estimated" must display an inline disclosure.

### TEAM-004: Effective Communication Score

Provide a configurable score derived from agreed dimensions such as clarity, response time, unresolved questions, tone consistency, and style-guide compliance.

The score must be explainable and must not be used as a covert employee-performance score. The score derivation must be documented and disclosed to all scored users.

### TEAM-005: Enterprise controls

Enterprise requirements include:

- SAML or OIDC SSO.
- SCIM provisioning.
- Domain capture.
- Role-based access control.
- Audit-log export.
- Data-retention policy.
- Legal hold and export where contractually required.
- Model allowlists.
- Connector allowlists.
- Agent and MCP allowlists.
- Regional data controls.
- Customer-managed encryption options where feasible.
- Dedicated support and service commitments.

---

## 11. Plan packaging

The following matrix is a proposed packaging model. “Unlimited” always remains subject to abuse prevention, infrastructure protection, and clearly disclosed fair-use rules.

| Capability | Free | Pro | Business | Enterprise |
|---|---|---|---|---|
| Go AI chat | Unlimited during beta; fair-use | Included with higher priority | Included with workspace controls | Controlled rollout and contractual limits |
| Durable background tasks | Low monthly quota | Medium quota | High pooled quota | Contracted quota |
| Inline suggestions in Creature | Included | Included | Included | Included |
| System-wide inline suggestions | Limited beta | Included when supported | Included with policy controls | Managed deployment |
| Connector and partner agents | Beta catalogue | Full catalogue | Full catalogue plus admin controls | Approved private catalogue |
| Correctness suggestions | Included | Included | Included | Included |
| Tone detection | Included | Included | Included | Included |
| Tone suggestions | Limited | Unlimited | Unlimited | Unlimited |
| Sentence and fluency rewrites | Limited | Unlimited | Unlimited | Unlimited |
| Inclusivity suggestions | Basic | Full | Configurable | Policy-controlled |
| Citation formatting | Limited styles | Full | Full | Full and custom styles |
| AI composition | Limited prompts | Higher quota | Pooled workspace quota | Contracted quota |
| Translation | Limited | Unlimited | Unlimited | Unlimited |
| Paragraph rewrites | Limited | Unlimited | Unlimited | Unlimited |
| Proofreader agent | Limited documents | Unlimited | Unlimited | Unlimited |
| AI detection | Limited | Included | Included with controls | Included with controls and audit |
| Plagiarism checker | Trial or add-on | Add-on | Included or pooled add-on | Contracted |
| Style guides | None | 1 | Unlimited | Unlimited with policy inheritance |
| Brand tones | 1 personal | 1 | Unlimited | Unlimited with approvals |
| Knowledge Share | Personal | Included | Shared | Governed and scoped |
| Snippets | Personal | Personal | Shared team library | Governed libraries |
| Analytics | Personal activity | Personal productivity | Team analytics | Team and individual analytics with policy controls |
| Mail AI | Basic | Full | Full | Full with policy controls |
| Auto Drafts, Labels, Archive, Reminders | Low quota | Medium quota | Unlimited within policy | Contracted and governed |
| Split Inbox and productivity features | Basic | Full | Full | Full |
| CRM read-only integrations | None | Optional | Included | Included with governance |
| Calendar and scheduling | Basic | Full | Full | Full |
| Shared mail collaboration | None | None or limited trial | Included | Included |
| Pages and objects | Limited shared docs | Unlimited | Unlimited | Unlimited |
| Docs AI assistant | Limited trial | Included | Included | Included |
| Databases | Limited beta | Included | Included | Included |
| AI views and pages | Limited trial | Included | Included | Included with policy controls |
| Automations | Low quota | Medium quota | Unlimited within fair-use | Contracted |
| Attachments | 1 GB per document | 5 GB per document | High or unlimited pooled storage | Contracted storage |
| Connector refresh | Manual | Daily | Hourly | Hourly or event-driven where available |
| Forms | Unlimited with Creature branding | Custom branding | Custom branding | Custom branding and domain controls |
| Cross-doc | Limited tables | Tables | Tables and actions | Tables and actions with governance |
| Version history | 7 days | 30 days | Unlimited | Unlimited plus retention policy |
| Desktop app | Included | Included | Included | Managed deployment |
| Mobile app | Not a launch dependency | Later | Later | Later and managed |
| MCP | Limited trial | Limited trial | Admin-controlled | Allowlisted, audited, and contract-controlled |
| Real-time collaboration | Basic | Included | Included | Included |
| Custom domains | None | Optional | Included | Included |
| Locking | Basic | Included | Advanced | Advanced and policy-enforced |
| Folder access management | Basic | Included | Advanced | Advanced custom roles |
| Page and document analytics | Basic | Included | Team analytics | Governed analytics |
| Domain capture | None | None | Optional | Included |
| SSO, SCIM, audit export, retention | None | None | Optional add-on | Included |

---

## 12. Technical architecture

## 12.1 Native desktop client

Native SDK is responsible for:

- Native windows and rendering.
- Application navigation and workspace UI.
- Keyboard shortcuts and command palette.
- System tray and notifications where supported.
- Clipboard and file-dialog integrations.
- Secure operating-system credential storage.
- Local cache and offline queues.
- Desktop packaging and updates.
- Deterministic UI automation and testing.

The client should use a strict service boundary between UI state and remote services so that Native SDK API changes do not propagate through business logic.

## 12.2 Eve agent runtime

Eve is responsible for:

- Agent definitions.
- Instructions.
- Tools.
- Skills.
- Subagents.
- Channels.
- Schedules.
- Durable session state.
- Pause, approval, resume, retry, and cancellation.
- Sandboxed work where configured.
- Agent evals and lifecycle hooks.

Recommended initial agent tree:

```text
agent/
  agent.ts
  instructions.md
  skills/
    compose-email.md
    proofread-document.md
    summarize-thread.md
    create-automation.md
    prepare-meeting.md
  tools/
    mail/
    calendar/
    docs/
    search/
    memory/
    approvals/
  subagents/
    researcher/
    writer/
    mail-triage/
    document-organizer/
    automation-planner/
  schedules/
    daily-brief.ts
    follow-up-check.ts
    connector-refresh.ts
  hooks/
    audit.ts
    telemetry.ts
    memory-candidate.ts
```

## 12.3 AI SDK 7 and AI Gateway

AI SDK 7 is the provider-neutral model and tool layer. It should be used for:

- Streaming.
- Structured output.
- Tool calls.
- Tool approvals.
- Runtime and tool context.
- Model reasoning configuration.
- File and skill references.
- Telemetry and lifecycle events.

AI Gateway is responsible for:

- Provider routing.
- Model fallback.
- Cost and usage visibility.
- Per-plan and per-workspace model policy.
- Provider outage mitigation.
- Model allowlists.

The default model policy should route routine classification, rewriting, extraction, and summarization to lower-cost models while reserving stronger models for complex planning, research synthesis, and high-impact drafts.

## 12.4 Vercel Connect and external services

Vercel Connect should be the preferred authentication and connector layer when supported. Long-lived provider credentials must not be exposed to the agent or stored in prompts.

Connector tools must receive only the credentials and context required for that tool call.

Initial connectors:

1. Gmail.
2. Google Calendar.
3. Google Drive.
4. Notion or equivalent knowledge source.
5. Slack.
6. GitHub for technical workflows.

Later connectors:

- Microsoft Outlook and Calendar.
- HubSpot.
- Salesforce.
- Pipedrive.
- Zoom.
- Microsoft Teams.
- Additional storage, project-management, messaging, and publishing systems.

## 12.5 Mnemosyne memory

Mnemosyne is a separate service boundary. Eve requests memories using user, workspace, project, task, and purpose scopes.

All memory writes must pass through:

1. Candidate extraction.
2. Sensitive-content filtering.
3. Deduplication and conflict detection.
4. User or policy approval where required.
5. Retention and provenance metadata.

## 12.6 Product data

Recommended logical storage:

- PostgreSQL for users, workspaces, permissions, documents, structured records, automations, run metadata, and audit indexes.
- Object storage for attachments, exports, generated artifacts, and immutable snapshots.
- Search index for lexical and semantic retrieval over permitted content.
- Local encrypted database for cached documents, message metadata, drafts, offline operations, and desktop preferences.
- Source systems remain canonical for connected mail, calendar, CRM, and external documents unless explicitly imported.

## 12.7 Collaboration and sync

Documents require an operation-based or CRDT-compatible collaboration model supporting:

- Concurrent editing.
- Offline edits.
- Reconnection.
- Presence.
- Attribution.
- Version restoration.
- Permission-aware synchronized blocks.

Agent edits must be attributed separately from human edits and presented as reviewable changes for large modifications.

---

## 13. Security and privacy

### 13.1 Permission classes

Actions must be classified as:

- Read-only.
- Local reversible write.
- External reversible write.
- External consequential write.
- Destructive or irreversible action.

Default behavior:

- Read-only actions may run within granted scopes.
- Reversible writes may be auto-approved only through an explicit rule.
- Consequential writes require preview and approval by default.
- Destructive or irreversible actions require explicit per-action approval and may be prohibited entirely.

### 13.2 Secret handling

- Store desktop credentials in the operating-system credential service through Native SDK.
- Prefer short-lived service tokens.
- Never include access tokens in model prompts, logs, telemetry, memory, or user-visible error messages.
- Redact secrets before persistence.
- Rotate or revoke compromised connector sessions.

**SEC-001:** Connector tokens, API keys, and authentication material must never appear in model prompts, logs, telemetry, memory, or user-visible error messages. This requirement must pass automated red-team validation.

### 13.3 Auditability

Record:

- Actor.
- Agent and version.
- Trigger.
- Inputs and source references.
- Tools called.
- Permissions used.
- Approvals.
- External changes.
- Output references.
- Cost and duration.
- Error and retry state.

Sensitive content should be referenced by secure identifiers where full retention is unnecessary.

### 13.4 Data controls

Support export, deletion, connector disconnection, memory deletion, workspace retention policies, and account closure workflows.

---

## 14. Non-functional requirements

### 14.1 Performance

- Desktop cold start target: under 2 seconds on supported reference hardware after installation warm-up.
- Navigation response target: under 100 ms for local transitions.
- Local writing-suggestion display target: under 300 ms when deterministic checks are sufficient.
- First streamed AI response target: under 2 seconds at the 75th percentile when provider latency permits.
- Offline document open target: under 500 ms for cached documents of ordinary size.

### 14.2 Reliability

- Durable runs must survive application closure, deploys, transient provider failures, and worker restarts.
- Duplicate webhook or connector events must not produce duplicate external actions.
- All write tools require idempotency keys where supported.
- Scheduled runs must expose missed, delayed, and retried executions.

### 14.3 Accessibility

- Full keyboard navigation.
- Visible focus states.
- Screen-reader labels.
- Scalable text.
- Reduced-motion support.
- High-contrast compatibility.
- Accessible error, diff, approval, and status interfaces.

### 14.4 Observability

Capture:

- Agent run latency.
- Model latency and usage.
- Tool latency.
- Connector latency and errors.
- Approval wait time.
- Retry counts.
- Suggestion acceptance.
- Automation success.
- Undo and correction rates.
- Memory retrieval and correction events.

### 14.5 Testing

Required layers:

- Unit tests for business rules and tool permission checks.
- Contract tests for connectors.
- Deterministic Native SDK UI tests.
- End-to-end tests for critical mail, docs, approval, and automation flows.
- Agent evals for drafting, summarization, source grounding, automation planning, and tool selection.
- Red-team tests for prompt injection, data exfiltration, unsafe writes, and cross-workspace access.

---

## 15. Metrics

### 15.1 North-star metric

**Weekly successfully completed assisted workflows per active user**, where a workflow produces a user-accepted output or approved action without requiring substantial rework.

### 15.2 Activation metrics

- First connector completed.
- First document created or imported.
- First accepted writing suggestion.
- First approved mail draft.
- First completed Go task.
- First enabled automation after dry-run.

### 15.3 Quality metrics

- Suggestion acceptance rate.
- Draft acceptance with minor edits.
- Citation-open and citation-correction rate.
- Incorrect-action rate.
- Undo rate.
- Automation disablement after error.
- Memory correction and deletion rate.
- Hallucinated commitment rate in mail drafts.
  - *Note: Heuristic detector flags inserted dates, prices, promises, deadlines, commitments. Rate = flagged ÷ total drafts. Requires periodic manual sampling for calibration.*

### 15.4 Reliability metrics

- Durable run completion rate.
- Connector sync success.
- External action duplication rate.
- Approval delivery success.
- Crash-free desktop sessions.
- Offline sync conflict rate.

### 15.5 Business metrics

- Free-to-Pro conversion.
- Pro-to-Business workspace expansion.
- Weekly retention.
- Active connected services.
- Paid-plan utilization.
- Cost per completed workflow.
  - *Note: Cost = total model + infrastructure cost ÷ completed workflows. Shared infrastructure costs allocated by proportional usage. Formula documented in companion spec.*

---

## 16. Delivery roadmap

## Phase 0 — Foundations

- Native SDK application shell.
- Authentication and workspace selection.
- Eve agent scaffold.
- AI SDK 7 and AI Gateway integration.
- Mnemosyne boundary.
- Local cache.
- Run timeline and approval UI.
- Permission and audit model.
- Basic telemetry and eval harness.

Exit criteria:

- A user can start, close, reopen, and resume a durable agent task.
- A risky mock tool pauses for approval and resumes correctly.
- Desktop credentials are stored through the native credential service.

## Phase 1 — Personal MVP

- Go AI chat and task inbox.
- Creature document editor.
- Correctness, tone, rewrite, composition, and proofreader features.
- Gmail read, search, summarize, and draft.
- Google Calendar read and event preview.
- Basic pages, attachments, version history, and search.
- Personal snippets and memory controls.
- Manual connectors.

Exit criteria:

- A user can complete the four key journeys in Section 9.
- No external message or event is sent or created without approval.
- Core flows pass Windows, macOS, and Linux desktop tests.

## Phase 2 — Pro productivity

- Split Inbox.
- Auto Drafts, labels, reminders, summaries, and archive in dry-run and active modes.
- Translation and advanced rewriting.
- Databases and forms.
- Cross-document tables.
- Daily connector refresh.
- Automation builder.
- Agent catalogue and MCP access.
- Offline mail and document improvements.

## Phase 3 — Business collaboration

- Shared mail conversations, comments, and drafts.
- Real-time document collaboration.
- Shared snippets, knowledge, style guides, and brand tones.
- Hourly connector refresh.
- AI views.
- Cross-document actions.
- Workspace analytics and ROI reports.
- CRM read-only integrations.
- Roles and administrative policies.

## Phase 4 — Enterprise readiness

- SSO and SCIM.
- Domain capture.
- Advanced audit and export.
- Retention and legal controls.
- Model, connector, agent, and MCP allowlists.
- Regional deployment options.
- Managed desktop deployment and update channels.
- Contracted quotas and service commitments.

## Phase 5 — Expansion

- Microsoft mail and calendar.
- Additional partner agents and connectors.
- Advanced system-wide writing assistance.
- Mobile evaluation after Native SDK mobile APIs and packaging are sufficiently stable.
- Optional developer and data-workspace agents using isolated execution and GitHub pull-request workflows.

---

## 17. MVP acceptance criteria

The MVP is ready for private beta when all conditions are met:

1. The native desktop app installs and launches on supported Windows, macOS, and Linux reference environments.
2. A user can authenticate and connect Gmail and Google Calendar.
3. The Go Agent can complete a durable multi-step task, pause for user input, and resume after the app is closed.
4. The writing editor supports correctness, tone, rewriting, composition, and full-document proofreading.
5. Mail supports search, thread summary, draft generation, and event preview.
6. All sends, event creations, and consequential writes are approval-gated.
7. Docs support pages, attachments, local cache, version history, and basic sharing.
8. Users can inspect and delete stored memory.
9. Every agent run exposes status, sources, tools, approvals, errors, and outputs.
10. Cross-workspace access tests show no unauthorized content leakage.
11. Connector tokens and secrets are absent from prompts, logs, telemetry, and memory.
12. Critical workflows pass deterministic desktop and end-to-end tests.
13. Seven days of real writing, email, research, scheduling, and document tasks can be completed without maintaining a separate manual agent-tracking system.

---

## 18. Principal risks and mitigations

### Risk 1: Product scope is too broad

Mitigation: Treat the full matrix as a multi-phase vision. Gate the MVP to Go, core writing, Gmail, Google Calendar, basic Docs, and safe approvals.

### Risk 2: Native SDK is pre-1.0

Mitigation:

- Pin versions.
- Isolate Native SDK behind application adapters.
- Avoid depending on experimental mobile support.
- Maintain automated tests across all supported desktop platforms.
- Keep authentication and selected complex surfaces capable of using an embedded or companion web surface without converting the whole application into a WebView shell.

### Risk 3: Eve APIs evolve quickly

Mitigation:

- Keep domain tools independent of Eve-specific registration code.
- Wrap session, approval, and schedule integrations.
- Maintain direct AI SDK 7 and Workflow-compatible boundaries for critical workflows.
- Pin and test framework upgrades before rollout.

### Risk 4: Email automation damages trust

Mitigation:

- Use simulation and dry-run modes.
- Require approval for sends by default.
- Provide clear rule explanations and undo where supported.
- Limit volume and recipients.
- Escalate uncertainty rather than acting.

### Risk 5: AI output introduces false facts or commitments

Mitigation:

- Ground drafts in selected sources.
- Highlight inserted dates, prices, promises, deadlines, and commitments.
- Require review for high-impact communication.
- Run deterministic checks before approval.

### Risk 6: Memory becomes incorrect or invasive

Mitigation:

- Store provenance and confidence.
- Separate inferred and user-confirmed memory.
- Provide visible controls and deletion.
- Exclude secrets and highly sensitive categories by default.

### Risk 7: Team analytics becomes employee surveillance

Mitigation:

- Aggregate by default.
- Disclose collection and formulas.
- Avoid hidden individual scoring.
- Require policy controls for individual analytics.
- Do not present estimates as objective performance measures.

---

## 19. Open product decisions

The following decisions remain open. Items marked ⚠️ are architecture-blocking and must be resolved before Phase 0 begins; unmarked items are non-blocking.

**Blocking (resolve before Phase 0):**
- ⚠️ Whether the first collaborative document engine is implemented internally or built on an existing CRDT service (D7).
- ⚠️ Which Native SDK UI surfaces should be fully native versus selectively WebView-backed (D8).
- ⚠️ Which model is the default for each task class (D9).

**Non-blocking (product validation):**
- Final product name and module names (D1).
- Exact pricing and fair-use limits (D2).
- Whether plagiarism checking is included, an add-on, or partner-provided (D3).
- Which languages meet launch quality thresholds (D4).
- Whether Pro includes any shared-mail collaboration (D5).
- Whether custom domains begin in Pro or Business (D6).
- Which enterprise regions and compliance commitments are commercially justified (D10).

Resolution status and owners are tracked in `spec/decision-gates.md`.

---

## 20. Technical-source assumptions

This PRD assumes the following current platform characteristics:

- Vercel Eve is a filesystem-first TypeScript framework whose agent structure includes instructions, tools, skills, subagents, channels, schedules, durable sessions, approvals, and resumable work.
- AI SDK 7 is the model- and provider-neutral layer beneath Eve and includes tool context, runtime context, approvals, durability options, telemetry, file references, and skills support.
- Native SDK provides native desktop rendering, TypeScript-authored application logic, native operating-system capabilities, packaging, automation, and secure credential access. Desktop is the mature target; mobile support is experimental.
- Vercel Connect can provide managed connectors and short-lived credentials for supported services.

Framework versions and capabilities must be revalidated during implementation because Eve and Native SDK are new and evolving projects.

**Validation status:** All assumptions are unvalidated as of this revision. Each must be proven during Phase 0 implementation via the verification method noted in `spec/workstreams/w9-open-decisions.md`.
