// AUTO-005 — Connector health monitor.
import type { ConnectorHealth } from '../../core/types';

export class ConnectorHealthMonitor {
  private health = new Map<string, ConnectorHealth>();

  report(id: string, status: ConnectorHealth['status'], partial: Partial<ConnectorHealth> = {}): ConnectorHealth {
    const h: ConnectorHealth = { id, status, scopes: partial.scopes ?? { read: false, write: false, grantedScopes: [] }, ...partial };
    this.health.set(id, h);
    return h;
  }

  get(id: string): ConnectorHealth | undefined {
    return this.health.get(id);
  }

  reconnect(id: string): ConnectorHealth {
    return this.report(id, 'reconnecting');
  }

  expiredTokens(): ConnectorHealth[] {
    return Array.from(this.health.values()).filter((h) => h.tokenExpiry != null && h.tokenExpiry < Date.now());
  }
}
