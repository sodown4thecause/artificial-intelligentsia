// AUTO-004 — Connector permission model. Least privilege, read/write separate, reauth on scope expansion.
import type { ConnectorScope } from '../../core/types';

export class ConnectorAuth {
  current: ConnectorScope;

  constructor(initial: ConnectorScope) {
    this.current = initial;
  }

  /** Detect whether requested scopes expand beyond currently granted; force reauth if so. */
  requestScopes(requested: ConnectorScope): { granted: boolean; requiresReauth: boolean; addedScopes: string[] } {
    const added = requested.grantedScopes.filter((s: string) => !this.current.grantedScopes.includes(s));
    const expanded = requested.write && !this.current.write;
    const requiresReauth = added.length > 0 || expanded;
    if (requiresReauth) {
      return { granted: false, requiresReauth: true, addedScopes: added };
    }
    this.current = requested;
    return { granted: true, requiresReauth: false, addedScopes: [] };
  }
}
