import type { FeatureFlagAuditLog } from './audit.js';
import type {
  FeatureFlagChange,
  FeatureFlagChangeRequest,
  FeatureFlagConfiguration,
  FeatureFlagContext,
  FeatureFlagDefinition,
  FeatureFlagEvaluation,
  FeatureFlagOverrides,
  FeatureFlagScope,
} from './types.js';

type MutableFeatureFlagOverrides = {
  platform?: boolean;
  workspaces: Record<string, boolean>;
  users: Record<string, boolean>;
  cohorts: Record<string, boolean>;
};

export interface FeatureFlagStoreOptions {
  readonly initialConfiguration?: FeatureFlagConfiguration;
  readonly auditLog?: FeatureFlagAuditLog;
  readonly now?: () => Date;
}

/**
 * Evaluates a flag with deny precedence. Missing configuration is deliberately
 * treated as disabled, including for flags unknown to a store.
 */
export function evaluateFeatureFlag(
  flag: Pick<FeatureFlagDefinition, 'name' | 'defaultEnabled'>,
  context: FeatureFlagContext = {},
  overrides: FeatureFlagOverrides = {},
): FeatureFlagEvaluation {
  const matches: Array<{ scope: FeatureFlagScope; value: boolean | undefined }> = [
    { scope: 'platform', value: overrides.platform },
    { scope: 'workspace', value: context.workspaceId === undefined ? undefined : overrides.workspaces?.[context.workspaceId] },
    { scope: 'user', value: context.userId === undefined ? undefined : overrides.users?.[context.userId] },
    { scope: 'cohort', value: context.cohort === undefined ? undefined : overrides.cohorts?.[context.cohort] },
  ];
  const matchedScopes = matches
    .filter((match): match is { scope: FeatureFlagScope; value: boolean } => match.value !== undefined)
    .map((match) => match.scope);

  if (matches.some((match) => match.value === false)) {
    return { flag: flag.name, enabled: false, reason: 'disabled-by-override', matchedScopes };
  }

  if (matches.some((match) => match.value === true)) {
    return { flag: flag.name, enabled: true, reason: 'enabled-by-override', matchedScopes };
  }

  return {
    flag: flag.name,
    enabled: false,
    reason: 'default-disabled',
    matchedScopes,
  };
}

/** In-memory configuration store; connect its audit boundary to durable storage in production. */
export class FeatureFlagStore {
  private readonly definitions = new Map<string, FeatureFlagDefinition>();
  private readonly configuration = new Map<string, MutableFeatureFlagOverrides>();
  private readonly auditLog?: FeatureFlagAuditLog;
  private readonly now: () => Date;

  constructor(definitions: readonly FeatureFlagDefinition[], options: FeatureFlagStoreOptions = {}) {
    for (const definition of definitions) {
      if (this.definitions.has(definition.name)) {
        throw new Error(`Duplicate feature flag definition: ${definition.name}`);
      }
      this.definitions.set(definition.name, definition);
    }
    this.auditLog = options.auditLog;
    this.now = options.now ?? (() => new Date());
    this.loadInitialConfiguration(options.initialConfiguration);
  }

  evaluate(flag: string, context: FeatureFlagContext = {}): FeatureFlagEvaluation {
    const definition = this.definitions.get(flag);
    if (definition === undefined) {
      return { flag, enabled: false, reason: 'default-disabled', matchedScopes: [] };
    }
    return evaluateFeatureFlag(definition, context, this.getOverrides(flag));
  }

  isEnabled(flag: string, context: FeatureFlagContext = {}): boolean {
    return this.evaluate(flag, context).enabled;
  }

  setOverride(request: FeatureFlagChangeRequest): FeatureFlagChange {
    this.requireDefinedFlag(request.flag);
    const scopeId = this.validateScopeId(request);
    const overrides = this.getMutableOverrides(request.flag);
    const previousValue = this.getScopeValue(overrides, request.scope, scopeId);
    this.setScopeValue(overrides, request.scope, scopeId, request.value);

    const change: FeatureFlagChange = {
      ...request,
      ...(previousValue === undefined ? {} : { previousValue }),
      changedAt: this.now(),
    };
    this.auditLog?.record(change);
    return change;
  }

  getOverrides(flag: string): FeatureFlagOverrides {
    const overrides = this.configuration.get(flag);
    if (overrides === undefined) {
      return {};
    }
    return {
      ...(overrides.platform === undefined ? {} : { platform: overrides.platform }),
      workspaces: { ...overrides.workspaces },
      users: { ...overrides.users },
      cohorts: { ...overrides.cohorts },
    };
  }

  private loadInitialConfiguration(initialConfiguration: FeatureFlagConfiguration | undefined): void {
    if (initialConfiguration === undefined) {
      return;
    }
    for (const [flag, overrides] of Object.entries(initialConfiguration)) {
      this.requireDefinedFlag(flag);
      this.configuration.set(flag, {
        ...(overrides.platform === undefined ? {} : { platform: overrides.platform }),
        workspaces: { ...overrides.workspaces },
        users: { ...overrides.users },
        cohorts: { ...overrides.cohorts },
      });
    }
  }

  private requireDefinedFlag(flag: string): void {
    if (!this.definitions.has(flag)) {
      throw new Error(`Unknown feature flag: ${flag}`);
    }
  }

  private validateScopeId(request: FeatureFlagChangeRequest): string | undefined {
    if (request.scope === 'platform') {
      if (request.scopeId !== undefined) {
        throw new Error('Platform feature flag overrides must not include a scopeId.');
      }
      return undefined;
    }
    if (request.scopeId === undefined || request.scopeId.trim() === '') {
      throw new Error(`${request.scope} feature flag overrides require a scopeId.`);
    }
    return request.scopeId;
  }

  private getMutableOverrides(flag: string): MutableFeatureFlagOverrides {
    const existing = this.configuration.get(flag);
    if (existing !== undefined) {
      return existing;
    }
    const created: MutableFeatureFlagOverrides = { workspaces: {}, users: {}, cohorts: {} };
    this.configuration.set(flag, created);
    return created;
  }

  private getScopeValue(
    overrides: MutableFeatureFlagOverrides,
    scope: FeatureFlagScope,
    scopeId: string | undefined,
  ): boolean | undefined {
    if (scope === 'platform') {
      return overrides.platform;
    }
    if (scope === 'workspace') {
      return overrides.workspaces[scopeId as string];
    }
    if (scope === 'user') {
      return overrides.users[scopeId as string];
    }
    return overrides.cohorts[scopeId as string];
  }

  private setScopeValue(
    overrides: MutableFeatureFlagOverrides,
    scope: FeatureFlagScope,
    scopeId: string | undefined,
    value: boolean,
  ): void {
    if (scope === 'platform') {
      overrides.platform = value;
      return;
    }
    if (scope === 'workspace') {
      overrides.workspaces[scopeId as string] = value;
      return;
    }
    if (scope === 'user') {
      overrides.users[scopeId as string] = value;
      return;
    }
    overrides.cohorts[scopeId as string] = value;
  }
}
