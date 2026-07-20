import {
  type ConnectorHealth,
  type ConnectorScope,
  type ManagedConnector,
  ConnectorError,
  requireHealthyConnection,
} from "./types.js";

export interface MockVercelConnectOptions {
  connections: readonly ConnectorHealth[];
  now?: () => Date;
}

/**
 * Contract double for Vercel Connect. It exposes connection health and grants,
 * never provider credentials or authentication material.
 */
export class MockVercelConnect implements ManagedConnector {
  private readonly connections = new Map<string, ConnectorHealth>();
  private readonly now: () => Date;

  public constructor(options: MockVercelConnectOptions) {
    options.connections.forEach((connection) => this.connections.set(connection.connectorId, connection));
    this.now = options.now ?? (() => new Date());
  }

  public getHealth(connectorId: string): ConnectorHealth {
    const health = this.connections.get(connectorId);
    if (health === undefined) {
      throw new ConnectorError("NOT_FOUND", `Connector ${connectorId} was not found.`);
    }
    return health;
  }

  public requireScopes(connectorId: string, requiredScopes: readonly ConnectorScope[]): void {
    requireHealthyConnection(this.getHealth(connectorId), requiredScopes, this.now());
  }

  public listHealth(): readonly ConnectorHealth[] {
    return [...this.connections.values()];
  }

  public setEnabled(connectorId: string, enabled: boolean): ConnectorHealth {
    const current = this.getHealth(connectorId);
    const next: ConnectorHealth = {
      ...current,
      enabled,
      status: enabled
        ? current.expiresAt !== null && current.expiresAt <= this.now()
          ? "expired"
          : "connected"
        : "disconnected",
      error: enabled ? current.error : null,
    };
    this.connections.set(connectorId, next);
    return next;
  }

  public refresh(connectorId: string): ConnectorHealth {
    const current = this.getHealth(connectorId);
    requireHealthyConnection(current, [], this.now());
    const refreshed: ConnectorHealth = {
      ...current,
      status: "connected",
      lastSuccessfulSyncAt: this.now(),
      error: null,
    };
    this.connections.set(connectorId, refreshed);
    return refreshed;
  }

  public reconnect(connectorId: string, grantedScopes: readonly ConnectorScope[]): ConnectorHealth {
    const current = this.getHealth(connectorId);
    const reconnected: ConnectorHealth = {
      ...current,
      enabled: true,
      status: "connected",
      grantedScopes: [...grantedScopes],
      expiresAt: null,
      error: null,
    };
    this.connections.set(connectorId, reconnected);
    return reconnected;
  }
}

export function createMockVercelConnect(options: MockVercelConnectOptions): MockVercelConnect {
  return new MockVercelConnect(options);
}
