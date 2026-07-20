/** The risk domain protected by a feature flag. */
export type FeatureFlagKind =
  | 'tool'
  | 'model-policy'
  | 'connector'
  | 'automation-mode'
  | 'rollout-cohort';

/** A named cohort used to progressively roll out a feature. */
export type RolloutCohort = string;

/** A flag definition is code-owned; its overrides are configuration-owned. */
export interface FeatureFlagDefinition {
  readonly name: string;
  readonly kind: FeatureFlagKind;
  readonly description: string;
  readonly defaultEnabled: boolean;
}

/** The identities available when a flag is evaluated. */
export interface FeatureFlagContext {
  readonly workspaceId?: string;
  readonly userId?: string;
  readonly cohort?: RolloutCohort;
}

export type FeatureFlagScope = 'platform' | 'workspace' | 'user' | 'cohort';
export type FeatureFlagValue = boolean;

/**
 * Overrides are additive allow-lists: an explicit false at any matching scope
 * always wins, so a narrower configuration cannot bypass a kill switch.
 */
export interface FeatureFlagOverrides {
  readonly platform?: FeatureFlagValue;
  readonly workspaces?: Readonly<Record<string, FeatureFlagValue>>;
  readonly users?: Readonly<Record<string, FeatureFlagValue>>;
  readonly cohorts?: Readonly<Record<RolloutCohort, FeatureFlagValue>>;
}

export type FeatureFlagConfiguration = Readonly<Record<string, FeatureFlagOverrides>>;

export interface FeatureFlagEvaluation {
  readonly flag: string;
  readonly enabled: boolean;
  readonly reason: 'disabled-by-override' | 'enabled-by-override' | 'default-disabled';
  readonly matchedScopes: readonly FeatureFlagScope[];
}

export interface FeatureFlagChangeRequest {
  readonly flag: string;
  readonly scope: FeatureFlagScope;
  readonly scopeId?: string;
  readonly value: FeatureFlagValue;
  readonly actorId: string;
  readonly reason: string;
}

export interface FeatureFlagChange extends FeatureFlagChangeRequest {
  readonly previousValue?: FeatureFlagValue;
  readonly changedAt: Date;
}
