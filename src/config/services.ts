export interface ServiceConfiguration {
  braintrust: {
    apiKey: string;
    project: string;
  };
  aiGateway: {
    apiKey: string;
    baseUrl: string;
  };
  vercelConnect: {
    environment: "development" | "preview" | "production";
    url: string;
  };
  postgresql: {
    databaseUrl: string;
  };
}

export type ServiceEnvironment = Readonly<Record<string, string | undefined>>;

export class ServiceConfigurationError extends Error {
  public constructor(public readonly invalidVariables: readonly string[]) {
    super(`Invalid required service configuration: ${invalidVariables.join(", ")}`);
    this.name = "ServiceConfigurationError";
  }
}

const requiredVariables = [
  "BRAINTRUST_API_KEY",
  "BRAINTRUST_PROJECT",
  "AI_GATEWAY_API_KEY",
  "AI_GATEWAY_BASE_URL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "DATABASE_URL",
] as const;

type RequiredVariable = (typeof requiredVariables)[number];

function readRequiredEnvironment(
  environment: ServiceEnvironment,
): Record<RequiredVariable, string> {
  const values = {} as Record<RequiredVariable, string>;
  const invalidVariables: string[] = [];

  for (const variable of requiredVariables) {
    const value = environment[variable]?.trim();
    if (value === undefined || value.length === 0) {
      invalidVariables.push(variable);
      continue;
    }

    values[variable] = value;
  }

  if (invalidVariables.length > 0) {
    throw new ServiceConfigurationError(invalidVariables);
  }

  return values;
}

function validateUrl(variable: string, value: string, protocols: readonly string[]): void {
  try {
    const url = new URL(value);
    if (!protocols.includes(url.protocol)) {
      throw new TypeError("Unsupported protocol");
    }
  } catch {
    throw new ServiceConfigurationError([variable]);
  }
}

function validateVercelUrl(value: string): void {
  if (value.includes("://") || /[/?#]/.test(value)) {
    throw new ServiceConfigurationError(["VERCEL_URL"]);
  }

  try {
    const url = new URL(`https://${value}`);
    if (!url.hostname) {
      throw new TypeError("Missing hostname");
    }
  } catch {
    throw new ServiceConfigurationError(["VERCEL_URL"]);
  }
}

export function validateServiceConfiguration(
  environment: ServiceEnvironment = process.env,
): ServiceConfiguration {
  const values = readRequiredEnvironment(environment);

  if (
    values.VERCEL_ENV !== "development" &&
    values.VERCEL_ENV !== "preview" &&
    values.VERCEL_ENV !== "production"
  ) {
    throw new ServiceConfigurationError(["VERCEL_ENV"]);
  }

  validateUrl("AI_GATEWAY_BASE_URL", values.AI_GATEWAY_BASE_URL, ["https:", "http:"]);
  validateVercelUrl(values.VERCEL_URL);
  validateUrl("DATABASE_URL", values.DATABASE_URL, ["postgres:", "postgresql:"]);

  return {
    braintrust: {
      apiKey: values.BRAINTRUST_API_KEY,
      project: values.BRAINTRUST_PROJECT,
    },
    aiGateway: {
      apiKey: values.AI_GATEWAY_API_KEY,
      baseUrl: values.AI_GATEWAY_BASE_URL,
    },
    vercelConnect: {
      environment: values.VERCEL_ENV,
      url: values.VERCEL_URL,
    },
    postgresql: {
      databaseUrl: values.DATABASE_URL,
    },
  };
}
