import type { ConnectorHealth, ConnectorScope } from "../../connectors/types.js";
import type { ConnectorManagementClient } from "../hooks/useConnectors.js";
import { useConnectors } from "../hooks/useConnectors.js";

export interface ConnectorSettingsProps {
  client: ConnectorManagementClient;
}

export function ConnectorSettings({ client }: ConnectorSettingsProps): JSX.Element {
  const { connectors, error, loading, disable, enable, refresh, reconnect } = useConnectors(client);

  if (loading) {
    return <p aria-live="polite">Loading connectors…</p>;
  }

  return (
    <section aria-labelledby="connector-settings-heading">
      <h2 id="connector-settings-heading">Connected services</h2>
      {error === null ? null : <p role="alert">{error}</p>}
      {connectors.length === 0 ? <p>No connectors are configured.</p> : (
        <ul aria-label="Connectors">
          {connectors.map((connector) => (
            <ConnectorRow
              key={connector.connectorId}
              connector={connector}
              onEnable={enable}
              onDisable={disable}
              onRefresh={refresh}
              onReconnect={reconnect}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface ConnectorRowProps {
  connector: ConnectorHealth;
  onEnable(connectorId: string): Promise<void>;
  onDisable(connectorId: string): Promise<void>;
  onRefresh(connectorId: string): Promise<void>;
  onReconnect(connectorId: string, scopes: readonly ConnectorScope[]): Promise<void>;
}

export function ConnectorRow({ connector, onEnable, onDisable, onRefresh, onReconnect }: ConnectorRowProps): JSX.Element {
  const reconnectScopes = connector.grantedScopes.join(" ");
  return (
    <li>
      <article aria-label={`${connector.provider} connector`}>
        <h3>{connector.provider}</h3>
        <dl>
          <dt>Status</dt><dd>{connector.status}</dd>
          <dt>Enabled</dt><dd>{connector.enabled ? "Yes" : "No"}</dd>
          <dt>Scopes</dt><dd>{connector.grantedScopes.length === 0 ? "None" : connector.grantedScopes.join(", ")}</dd>
          <dt>Last sync</dt><dd>{formatDate(connector.lastSuccessfulSyncAt)}</dd>
          <dt>Token expiry</dt><dd>{formatDate(connector.expiresAt)}</dd>
        </dl>
        {connector.error === null ? null : <p role="alert">{connector.error.message}</p>}
        <button type="button" onClick={() => void (connector.enabled ? onDisable(connector.connectorId) : onEnable(connector.connectorId))}>
          {connector.enabled ? "Disable" : "Enable"}
        </button>
        <button type="button" disabled={!connector.enabled} onClick={() => void onRefresh(connector.connectorId)}>Refresh</button>
        <button type="button" onClick={() => void onReconnect(connector.connectorId, reconnectScopes === "" ? [] : reconnectScopes.split(" "))}>Reconnect</button>
      </article>
    </li>
  );
}

function formatDate(value: Date | null): string {
  return value === null ? "Not available" : value.toLocaleString();
}
