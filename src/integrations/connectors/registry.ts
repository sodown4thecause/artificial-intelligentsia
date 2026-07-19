// GO-004 / registry — connector & agent catalogue disclosing permissions/data access/publisher/version.
import { GmailConnector } from './gmail';
import { GoogleCalendarConnector } from './calendar';

export interface CatalogueEntry {
  id: string;
  name: string;
  publisher: string;
  version: string;
  requestedPermissions: string[];
  dataAccess: string[];
  externalServices: string[];
  type: 'connector' | 'agent' | 'mcp' | 'skill';
}

export const connectorRegistry: CatalogueEntry[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    publisher: 'Creature',
    version: '1.0.0',
    requestedPermissions: ['gmail.readonly'],
    dataAccess: ['messages', 'threads', 'labels'],
    externalServices: ['Google Gmail API'],
    type: 'connector',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    publisher: 'Creature',
    version: '1.0.0',
    requestedPermissions: ['calendar.readonly'],
    dataAccess: ['events'],
    externalServices: ['Google Calendar API'],
    type: 'connector',
  },
];

export function listConnectors(): CatalogueEntry[] {
  return connectorRegistry;
}

export function instantiate(id: string): GmailConnector | GoogleCalendarConnector | null {
  if (id === 'gmail') return new GmailConnector();
  if (id === 'google-calendar') return new GoogleCalendarConnector();
  return null;
}
