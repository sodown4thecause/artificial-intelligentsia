import assert from "node:assert/strict";
import test from "node:test";
import { CredentialManager } from "../../src/native/credentials.js";

test("stores and retrieves a connector token", async () => {
  const manager = new CredentialManager();
  await manager.setConnectorToken("test-provider", "token-value");
  assert.equal(await manager.getConnectorToken("test-provider"), "token-value");
});

test("deletes a connector token", async () => {
  const manager = new CredentialManager();
  await manager.setConnectorToken("delete-provider", "token-value");
  await manager.deleteConnectorToken("delete-provider");
  await assert.rejects(manager.getConnectorToken("delete-provider"), /Credential not found/);
});

test("does not write connector tokens to logs", async () => {
  const secret = "never-log-this-token";
  const messages: unknown[][] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => messages.push(args);
  try {
    const manager = new CredentialManager();
    await manager.setConnectorToken("logging-provider", secret);
    await manager.getConnectorToken("logging-provider");
    await manager.deleteConnectorToken("logging-provider");
  } finally {
    console.log = originalLog;
  }
  assert.equal(JSON.stringify(messages).includes(secret), false);
});
