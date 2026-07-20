import {
  type ConnectorErrorDetails,
  type ConnectorHealth,
  type ConnectorScope,
  type ManagedConnector,
  ConnectorError,
} from "./types.js";

export type ConnectorManagementAction = "enable" | "disable" | "refresh" | "reconnect";

export interface ConnectorManagementAuditEvent {
  action: ConnectorManagementAction;
  connectorId: string;
  provider: string;
  occurredAt: Date;
  outcome: "success" | "failure";
  error?: ConnectorErrorDetails;
}

export interface ConnectorServiceOptions {
  connectors: readonly ManagedConnector[];
  audit?: (event: ConnectorManagementAuditEvent) => void;
  now?: () => Date;
}

/**
 * Provides a credential-free management boundary around provider connectors.
 * Reconnection may retain or reduce grants, but it cannot increase them.
 */
export class ConnectorService {
  private readonly connectors: readonly ManagedConnector[];
  private readonly audit: (event: ConnectorManagementAuditEvent) => void;
  private readonly now: () => Date;

  public constructor(options: ConnectorServiceOptions) {
    this.connectors = options.connectors;
    this.audit = options.audit ?? (() => undefined);
    this.now = options.now ?? (() => new Date());
  }

  public listHealth(): readonly ConnectorHealth[] {
    return this.connectors.flatMap((connector) =>
      connector.listHealth === undefined ? [] : connector.listHealth().map(sanitizeHealth),
    );
  }

  public getHealth(connectorId: string): ConnectorHealth {
    return sanitizeHealth(this.findConnector(connectorId).getHealth(connectorId));
  }

  public enable(connectorId: string): ConnectorHealth {
    return this.manage("enable", connectorId, (connector) => this.setEnabled(connector, connectorId, true));
  }

  public disable(connectorId: string): ConnectorHealth {
    return this.manage("disable", connectorId, (connector) => this.setEnabled(connector, connectorId, false));
  }

  public refresh(connectorId: string): ConnectorHealth {
    return this.manage("refresh", connectorId, (connector) => {
      if (connector.refresh === undefined) {
        throw new ConnectorError("MANAGEMENT_UNAVAILABLE", "Manual refresh is unavailable for this connector.");
      }
      return connector.refresh(connectorId);
    });
  }

  public reconnect(connectorId: string, requestedScopes: readonly ConnectorScope[]): ConnectorHealth {
    return this.manage("reconnect", connectorId, (connector) => {
      const current = connector.getHealth(connectorId);
      const broadenedScope = requestedScopes.find((scope) => !current.grantedScopes.includes(scope));
      if (broadenedScope !== undefined) {
        throw new ConnectorError(
          "VALIDATION_ERROR",
          `Reconnection cannot add the ungranted scope: ${broadenedScope}`,
        );
      }
      return connector.reconnect(connectorId, requestedScopes);
    });
  }

  private setEnabled(connector: ManagedConnector, connectorId: string, enabled: boolean): ConnectorHealth {
    if (connector.setEnabled === undefined) {
      throw new ConnectorError("MANAGEMENT_UNAVAILABLE", "Enable and disable are unavailable for this connector.");
    }
    return connector.setEnabled(connectorId, enabled);
  }

  private findConnector(connectorId: string): ManagedConnector {
    const connector = this.connectors.find((candidate) => {
      try {
        candidate.getHealth(connectorId);
        return true;
      } catch (error) {
        if (!(error instanceof ConnectorError) || error.code !== "NOT_FOUND") {
          throw error;
        }
        return false;
      }
    });
    if (connector === undefined) {
      throw new ConnectorError("NOT_FOUND", "The requested connector was not found.");
    }
    return connector;
  }

  private manage(
    action: ConnectorManagementAction,
    connectorId: string,
    operation: (connector: ManagedConnector) => ConnectorHealth,
  ): ConnectorHealth {
    let provider = "unknown";
    try {
      const connector = this.findConnector(connectorId);
      provider = connector.getHealth(connectorId).provider;
      const health = sanitizeHealth(operation(connector));
      this.record({ action, connectorId, provider, outcome: "success" });
      return health;
    } catch (error) {
      const safeError = sanitizeError(error);
      this.record({ action, connectorId, provider, outcome: "failure", error: safeError.toDetails() });
      throw safeError;
    }
  }

  private record(event: Omit<ConnectorManagementAuditEvent, "occurredAt">): void {
    try {
      this.audit({ ...event, occurredAt: this.now() });
    } catch {
      // Audit transport failures must not change connector-management outcomes.
    }
  }
}

export function sanitizeHealth(health: ConnectorHealth): ConnectorHealth {
  return {
    ...health,
    grantedScopes: [...health.grantedScopes],
    error: health.error === null ? null : sanitizeErrorDetails(health.error),
  };
}

export function sanitizeErrorDetails(error: ConnectorErrorDetails): ConnectorErrorDetails {
  return { ...error, message: redactConnectorError(error.message) };
}

export function redactConnectorError(message: string): string {
  return message
    .replace(/\b(Bearer)\s+[^\s,;]+/gi, "$1 [REDACTED]")
    .replace(/\b(access[_-]?token|refresh[_-]?token|authorization|password|secret|api[_-]?key)\b\s*[=:]\s*[^\s,;]+/gi, "$1=[REDACTED]");
}

function sanitizeError(error: unknown): ConnectorError {
  if (error instanceof ConnectorError) {
    return new ConnectorError(error.code, redactConnectorError(error.message), error.reconnectRequired);
  }
  return new ConnectorError("CONNECTION_ERROR", "The connector operation failed. Try again or reconnect.");
}
