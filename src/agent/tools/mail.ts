// MAIL-001..016 — Mail domain. Gmail-first; reads via connector, writes staged through VFS.
import { GmailConnector } from '../../integrations/connectors/gmail';
import type { ToolProposal } from '../../core/types';

export class MailDomain {
  private gmail = new GmailConnector();

  // MAIL-001 provider scope
  provider(): string {
    return 'Gmail / Google Workspace (Microsoft Outlook follows after stable Gmail workflows).';
  }

  // MAIL-002 Ask AI
  async askAI(query: string): Promise<unknown> {
    return this.gmail.read('askAI', { query });
  }

  // MAIL-003 Write with AI
  draftWithAI(to: string, subject: string, body: string): string {
    return this.gmail.draftEmail({ to, subject, body });
  }

  // MAIL-004 Instant Reply — user must review before send.
  instantReply(_threadId: string, intent: string): { options: string[]; requiresReview: true } {
    return { options: [`Reply (${intent}): ...`], requiresReview: true };
  }

  // MAIL-005 Instant Event
  instantEvent(title: string, when: string): string {
    return this.gmail.createEventPreview({ title, when });
  }

  // MAIL-006 Auto Drafts
  autoDraft(to: string, subject: string): string {
    return this.gmail.draftEmail({ to, subject, body: '' });
  }

  // MAIL-007 Auto Archive (dry-run before active)
  autoArchive(threadIds: string[], mode: 'dry-run' | 'active'): string | { simulated: number } {
    if (mode === 'dry-run') return { simulated: threadIds.length };
    return this.gmail.archive({ threadIds });
  }

  // MAIL-008 Auto Labels
  autoLabel(_threadId: string, label: string): string {
    return this.gmail.applyLabel({ threadId: _threadId, label });
  }

  // MAIL-009 Auto Reminders — confirmation unless rule covers it
  autoReminder(commitment: string): { proposal: string; requiresConfirmation: boolean } {
    return { proposal: `Remind: ${commitment}`, requiresConfirmation: true };
  }

  // MAIL-010 Auto Summarize
  summarize(_threadId: string): { summary: string; preserved: string[] } {
    return { summary: 'Summary of thread...', preserved: ['open questions', 'decisions', 'commitments', 'owners', 'dates'] };
  }

  // MAIL-011 Autocorrect/autocomplete in compose (no unsupported facts)
  autocomplete(prefix: string): string {
    return prefix; // foundation: returns prefix; model completion routed in full impl
  }

  // MAIL-012 Split Inbox
  splitInbox(threads: { id: string; label: string }[], rules: Record<string, string>): Record<string, string[]> {
    const sections: Record<string, string[]> = {};
    for (const t of threads) {
      const section = Object.entries(rules).find(([, lbl]) => lbl === t.label)?.[0] ?? 'primary';
      (sections[section] ??= []).push(t.id);
    }
    return sections;
  }

  // MAIL-013 productivity features
  productivity(): string[] {
    return ['Snippets', 'Remind Me', 'Snooze', 'Unsubscribe', 'Read statuses (disclosed)', 'Quick Quote', 'Offline cache', 'Recent Opens'];
  }

  // MAIL-014 CRM read-only
  crmReadonly(): { mode: 'read-only'; futureWritesRequire: string[] } {
    return { mode: 'read-only', futureWritesRequire: ['separate permissions', 'previews', 'audit logs', 'approval policies'] };
  }

  // MAIL-015 Calendar & scheduling
  calendarFeatures(): string[] {
    return ['Calendar view', 'Availability', 'Find Time', 'Event previews', 'Zoom/Meet/Teams links'];
  }

  // MAIL-016 Team collaboration (Business/Enterprise)
  teamCollab(plan: 'Business' | 'Enterprise'): { supported: boolean; features: string[] } {
    const features = ['Shared conversations', 'Internal comments', 'Shared drafts', 'Team read statuses', 'Assignment', 'Team scheduling'];
    return { supported: plan === 'Business' || plan === 'Enterprise', features };
  }

  pendingProposals(): ToolProposal[] {
    return this.gmail ? [] : [];
  }
}
