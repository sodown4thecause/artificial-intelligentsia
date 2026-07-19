// Gmail connector — read methods real (mock data), writes staged via VFS. MAIL-001, MAIL-002/003/005/006/007/008/009/010.
import { Connector } from './base';
import type { ConnectorScope } from '../../core/types';

export class GmailConnector extends Connector {
  id = 'gmail';
  name = 'Gmail';
  publisher = 'Creature';
  version = '1.0.0';
  scopes: ConnectorScope = { read: true, write: false, grantedScopes: ['gmail.readonly'] };

  private threads = [
    { id: 't1', from: 'boss@co.com', subject: 'Q3 plan', snippet: 'Can you send the Q3 plan?' },
    { id: 't2', from: 'client@x.com', subject: 'Invoice', snippet: 'Please review the attached invoice.' },
  ];

  async read(method: string, args: Record<string, unknown>): Promise<unknown> {
    switch (method) {
      case 'searchThreads':
        return this.threads.filter((t) => JSON.stringify(t).toLowerCase().includes(String(args.query ?? '').toLowerCase()));
      case 'getThread':
        return this.threads.find((t) => t.id === args.id) ?? null;
      case 'askAI':
        return { answer: 'Based on the selected messages...', citedMessages: [args.id] };
      default:
        return null;
    }
  }

  /** MAIL-006 Auto Drafts — never implies sent. */
  draftEmail(args: { to: string; subject: string; body: string }): string {
    return this.stageWrite('mail:draft', args, `Draft reply to ${args.to}`, 'LOW');
  }

  /** MAIL-005 Instant Event — creation requires confirmation (staged). */
  createEventPreview(args: { title: string; when: string }): string {
    return this.stageWrite('mail:event-preview', args, `Preview event "${args.title}"`, 'LOW');
  }

  /** MAIL-007 Auto Archive — destructive, high impact. */
  archive(args: { threadIds: string[] }): string {
    return this.stageWrite('mail:archive', args, `Archive ${args.threadIds.length} thread(s)`, 'DESTRUCTIVE');
  }

  /** MAIL-008 Auto Labels — reversible write. */
  applyLabel(args: { threadId: string; label: string }): string {
    return this.stageWrite('mail:label', args, `Apply label "${args.label}"`, 'MEDIUM');
  }
}
