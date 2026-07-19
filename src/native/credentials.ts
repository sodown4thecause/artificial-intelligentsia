import { NativeCredentialStore } from "./bridge.js";

const connectorService = "creature-os.connector";

/**
 * Stores connector tokens outside application state. This class deliberately has no logging,
 * telemetry, or prompt serialization APIs, preventing token values from crossing those boundaries.
 */
export class CredentialManager {
  constructor(private readonly store: NativeCredentialStore = new NativeCredentialStore()) {}

  async setConnectorToken(provider: string, token: string): Promise<void> {
    this.validateProvider(provider);
    if (token.length === 0) throw new Error("Connector token must not be empty");
    await this.store.store(connectorService, provider, token);
  }

  async getConnectorToken(provider: string): Promise<string> {
    this.validateProvider(provider);
    return this.store.load(connectorService, provider);
  }

  async deleteConnectorToken(provider: string): Promise<void> {
    this.validateProvider(provider);
    await this.store.delete(connectorService, provider);
  }

  private validateProvider(provider: string): void {
    if (provider.trim().length === 0) throw new Error("Connector provider must not be empty");
  }
}
