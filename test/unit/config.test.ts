import assert from "node:assert/strict";
import test from "node:test";

import {
  ServiceConfigurationError,
  validateServiceConfiguration,
} from "../../src/config/services.js";
import { validateDesktopStartupConfiguration } from "../../src/config/startup.js";
import { bootstrapDesktop } from "../../src/desktop/main.js";

const validEnvironment = {
  BRAINTRUST_API_KEY: "braintrust-secret",
  BRAINTRUST_PROJECT: "creature-os",
  AI_GATEWAY_API_KEY: "gateway-secret",
  AI_GATEWAY_BASE_URL: "https://ai-gateway.vercel.sh/v1",
  VERCEL_ENV: "preview",
  VERCEL_URL: "creature-os-git-main.vercel.app",
  DATABASE_URL: "postgresql://creature:password@localhost:5432/creature",
} as const;

test("validates and returns all required service configuration", () => {
  const configuration = validateServiceConfiguration(validEnvironment);

  assert.equal(configuration.braintrust.project, "creature-os");
  assert.equal(configuration.aiGateway.baseUrl, "https://ai-gateway.vercel.sh/v1");
  assert.equal(configuration.vercelConnect.environment, "preview");
  assert.equal(configuration.postgresql.databaseUrl, validEnvironment.DATABASE_URL);
});

test("desktop startup fails closed when required configuration is missing", () => {
  const environment = { ...validEnvironment, DATABASE_URL: "" };

  assert.throws(
    () => validateDesktopStartupConfiguration(environment),
    (error: unknown) =>
      error instanceof ServiceConfigurationError &&
      error.invalidVariables.includes("DATABASE_URL"),
  );
});

test("desktop bootstrap stops before initialization when service configuration is missing", async () => {
  const environment = { ...validEnvironment, VERCEL_URL: "" };

  await assert.rejects(
    bootstrapDesktop(environment),
    (error: unknown) =>
      error instanceof ServiceConfigurationError &&
      error.invalidVariables.includes("VERCEL_URL"),
  );
});

test("configuration errors include variable names but never secret values", () => {
  const environment = { ...validEnvironment, AI_GATEWAY_API_KEY: "" };

  assert.throws(
    () => validateServiceConfiguration(environment),
    (error: unknown) => {
      assert.ok(error instanceof ServiceConfigurationError);
      assert.match(error.message, /AI_GATEWAY_API_KEY/);
      assert.doesNotMatch(error.message, /gateway-secret|braintrust-secret|password/);
      return true;
    },
  );
});

test("rejects malformed service URLs", () => {
  const environment = { ...validEnvironment, DATABASE_URL: "https://database.example.com" };

  assert.throws(
    () => validateServiceConfiguration(environment),
    (error: unknown) =>
      error instanceof ServiceConfigurationError &&
      error.invalidVariables.includes("DATABASE_URL"),
  );
});
