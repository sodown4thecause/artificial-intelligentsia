/** Provider scopes granted to a connection. Credentials intentionally do not cross this boundary. */
export type ConnectorScope = string;

export type ConnectorStatus = "connected" | "expired" | "disconnected" | "error";

export interface ConnectorHealth {
  connectorId: string;
  provider: string;
  enabled: boolean;
  status: ConnectorStatus;
  grantedScopes: readonly ConnectorScope[];
  expiresAt: Date | null;
  lastSuccessfulSyncAt: Date | null;
  error: ConnectorErrorDetails | null;
}

export interface ConnectorErrorDetails {
  code: ConnectorErrorCode;
  message: string;
  reconnectRequired: boolean;
}

export type ConnectorErrorCode =
  | "CONNECTION_DISABLED"
  | "CONNECTION_EXPIRED"
  | "MISSING_SCOPE"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "MANAGEMENT_UNAVAILABLE"
  | "CONNECTION_ERROR";

export class ConnectorError extends Error {
  public readonly reconnectRequired: boolean;

  public constructor(
    public readonly code: ConnectorErrorCode,
    message: string,
    reconnectRequired = false,
  ) {
    super(message);
    this.name = "ConnectorError";
    this.reconnectRequired = reconnectRequired;
  }

  public toDetails(): ConnectorErrorDetails {
    return {
      code: this.code,
      message: this.message,
      reconnectRequired: this.reconnectRequired,
    };
  }
}

export interface ManagedConnector {
  getHealth(connectorId: string): ConnectorHealth;
  requireScopes(connectorId: string, requiredScopes: readonly ConnectorScope[]): void;
  reconnect(connectorId: string, grantedScopes: readonly ConnectorScope[]): ConnectorHealth;

  /** Optional management operations so existing read-only connector consumers remain compatible. */
  listHealth?(): readonly ConnectorHealth[];
  setEnabled?(connectorId: string, enabled: boolean): ConnectorHealth;
  refresh?(connectorId: string): ConnectorHealth;
}

export function requireHealthyConnection(
  health: ConnectorHealth,
  requiredScopes: readonly ConnectorScope[],
  now: Date,
): void {
  if (!health.enabled || health.status === "disconnected") {
    throw new ConnectorError("CONNECTION_DISABLED", "The connector is not enabled.", true);
  }

  if (health.status === "expired" || (health.expiresAt !== null && health.expiresAt <= now)) {
    throw new ConnectorError("CONNECTION_EXPIRED", "The connector session has expired. Reconnect to continue.", true);
  }

  const missingScope = requiredScopes.find((scope) => !health.grantedScopes.includes(scope));
  if (missingScope !== undefined) {
    throw new ConnectorError("MISSING_SCOPE", `Missing required scope: ${missingScope}`, true);
  }
}
