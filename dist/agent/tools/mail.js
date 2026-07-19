// MAIL-001..016 — Mail domain. Gmail-first; reads via connector, writes staged through VFS.
import { GmailConnector } from '../../integrations/connectors/gmail';
export class MailDomain {
    gmail = new GmailConnector();
    // MAIL-001 provider scope
    provider() {
        return 'Gmail / Google Workspace (Microsoft Outlook follows after stable Gmail workflows).';
    }
    // MAIL-002 Ask AI
    async askAI(query) {
        return this.gmail.read('askAI', { query });
    }
    // MAIL-003 Write with AI
    draftWithAI(to, subject, body) {
        return this.gmail.draftEmail({ to, subject, body });
    }
    // MAIL-004 Instant Reply — user must review before send.
    instantReply(_threadId, intent) {
        return { options: [`Reply (${intent}): ...`], requiresReview: true };
    }
    // MAIL-005 Instant Event
    instantEvent(title, when) {
        return this.gmail.createEventPreview({ title, when });
    }
    // MAIL-006 Auto Drafts
    autoDraft(to, subject) {
        return this.gmail.draftEmail({ to, subject, body: '' });
    }
    // MAIL-007 Auto Archive (dry-run before active)
    autoArchive(threadIds, mode) {
        if (mode === 'dry-run')
            return { simulated: threadIds.length };
        return this.gmail.archive({ threadIds });
    }
    // MAIL-008 Auto Labels
    autoLabel(_threadId, label) {
        return this.gmail.applyLabel({ threadId: _threadId, label });
    }
    // MAIL-009 Auto Reminders — confirmation unless rule covers it
    autoReminder(commitment) {
        return { proposal: `Remind: ${commitment}`, requiresConfirmation: true };
    }
    // MAIL-010 Auto Summarize
    summarize(_threadId) {
        return { summary: 'Summary of thread...', preserved: ['open questions', 'decisions', 'commitments', 'owners', 'dates'] };
    }
    // MAIL-011 Autocorrect/autocomplete in compose (no unsupported facts)
    autocomplete(prefix) {
        return prefix; // foundation: returns prefix; model completion routed in full impl
    }
    // MAIL-012 Split Inbox
    splitInbox(threads, rules) {
        const sections = {};
        for (const t of threads) {
            const section = Object.entries(rules).find(([, lbl]) => lbl === t.label)?.[0] ?? 'primary';
            (sections[section] ??= []).push(t.id);
        }
        return sections;
    }
    // MAIL-013 productivity features
    productivity() {
        return ['Snippets', 'Remind Me', 'Snooze', 'Unsubscribe', 'Read statuses (disclosed)', 'Quick Quote', 'Offline cache', 'Recent Opens'];
    }
    // MAIL-014 CRM read-only
    crmReadonly() {
        return { mode: 'read-only', futureWritesRequire: ['separate permissions', 'previews', 'audit logs', 'approval policies'] };
    }
    // MAIL-015 Calendar & scheduling
    calendarFeatures() {
        return ['Calendar view', 'Availability', 'Find Time', 'Event previews', 'Zoom/Meet/Teams links'];
    }
    // MAIL-016 Team collaboration (Business/Enterprise)
    teamCollab(plan) {
        const features = ['Shared conversations', 'Internal comments', 'Shared drafts', 'Team read statuses', 'Assignment', 'Team scheduling'];
        return { supported: plan === 'Business' || plan === 'Enterprise', features };
    }
    pendingProposals() {
        return this.gmail ? [] : [];
    }
}
//# sourceMappingURL=mail.js.map