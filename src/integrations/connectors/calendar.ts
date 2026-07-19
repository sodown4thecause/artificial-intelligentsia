// Google Calendar connector — read real (mock), writes staged via VFS. MAIL-015.
import { Connector } from './base';
import type { ConnectorScope } from '../../core/types';

export class GoogleCalendarConnector extends Connector {
  id = 'google-calendar';
  name = 'Google Calendar';
  publisher = 'Creature';
  version = '1.0.0';
  scopes: ConnectorScope = { read: true, write: false, grantedScopes: ['calendar.readonly'] };

  private events = [{ id: 'e1', title: 'Standup', start: '2026-07-20T09:00:00Z' }];

  async read(method: string, args: Record<string, unknown>): Promise<unknown> {
    if (method === 'getEvents') return this.events.filter((e) => JSON.stringify(e).includes(String(args.query ?? '')));
    if (method === 'findTime') return { suggestion: '2026-07-20T14:00:00Z' };
    return null;
  }

  /** Event creation requires confirmation (staged, consequential). */
  createEventPreview(args: { title: string; start: string }): string {
    return this.stageWrite('calendar:event-preview', args, `Preview event "${args.title}"`, 'MEDIUM');
  }
}
