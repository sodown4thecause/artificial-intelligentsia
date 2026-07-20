import { createRequire } from "node:module";

export interface PostgresConnectionOptions {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

export interface PostgresClient {
  query: (text: string, values?: readonly unknown[]) => Promise<unknown>;
  end: () => Promise<void>;
}

export type PostgresClientConstructor = new (options: PostgresConnectionOptions) => PostgresClient;

function requiredEnvironmentValue(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name];
  if (!value) {
    throw new Error(`Missing required PostgreSQL environment variable: ${name}`);
  }
  return value;
}

export function postgresConnectionOptions(environment: NodeJS.ProcessEnv = process.env): PostgresConnectionOptions {
  if (environment.DATABASE_URL) {
    return { connectionString: environment.DATABASE_URL, ssl: environment.PGSSLMODE === "require" };
  }

  const port = Number(environment.PGPORT ?? "5432");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PGPORT must be an integer between 1 and 65535");
  }

  return {
    host: requiredEnvironmentValue(environment, "PGHOST"),
    port,
    database: requiredEnvironmentValue(environment, "PGDATABASE"),
    user: requiredEnvironmentValue(environment, "PGUSER"),
    password: requiredEnvironmentValue(environment, "PGPASSWORD"),
    ssl: environment.PGSSLMODE === "require",
  };
}

function installedPostgresClientConstructor(): PostgresClientConstructor {
  const require = createRequire(import.meta.url);
  const postgresModule = require("pg");
  const poolConstructor: PostgresClientConstructor = postgresModule.Pool;
  return poolConstructor;
}

export function createPostgresClient(
  environment: NodeJS.ProcessEnv = process.env,
  Client: PostgresClientConstructor = installedPostgresClientConstructor(),
): PostgresClient {
  return new Client(postgresConnectionOptions(environment));
}
