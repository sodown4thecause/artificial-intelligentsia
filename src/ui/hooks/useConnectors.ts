import { useCallback, useEffect, useState } from "react";
import type { ConnectorHealth, ConnectorScope } from "../../connectors/types.js";

export interface ConnectorManagementClient {
  listHealth(): readonly ConnectorHealth[] | Promise<readonly ConnectorHealth[]>;
  enable(connectorId: string): ConnectorHealth | Promise<ConnectorHealth>;
  disable(connectorId: string): ConnectorHealth | Promise<ConnectorHealth>;
  refresh(connectorId: string): ConnectorHealth | Promise<ConnectorHealth>;
  reconnect(connectorId: string, scopes: readonly ConnectorScope[]): ConnectorHealth | Promise<ConnectorHealth>;
}

export interface UseConnectorsResult {
  connectors: readonly ConnectorHealth[];
  error: string | null;
  loading: boolean;
  reload(): Promise<void>;
  enable(connectorId: string): Promise<void>;
  disable(connectorId: string): Promise<void>;
  refresh(connectorId: string): Promise<void>;
  reconnect(connectorId: string, scopes: readonly ConnectorScope[]): Promise<void>;
}

export function useConnectors(client: ConnectorManagementClient): UseConnectorsResult {
  const [connectors, setConnectors] = useState<readonly ConnectorHealth[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setConnectors(await client.listHealth());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load connectors.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const apply = useCallback(async (operation: () => ConnectorHealth | Promise<ConnectorHealth>) => {
    try {
      const next = await operation();
      setConnectors((current) => current.map((connector) => connector.connectorId === next.connectorId ? next : connector));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to manage connector.");
    }
  }, []);

  return {
    connectors,
    error,
    loading,
    reload,
    enable: (connectorId) => apply(() => client.enable(connectorId)),
    disable: (connectorId) => apply(() => client.disable(connectorId)),
    refresh: (connectorId) => apply(() => client.refresh(connectorId)),
    reconnect: (connectorId, scopes) => apply(() => client.reconnect(connectorId, scopes)),
  };
}
