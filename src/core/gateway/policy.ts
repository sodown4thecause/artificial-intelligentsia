/** D9 gateway-owned aliases. Provider model IDs must not leave the gateway. */
export type ModelAlias = 'creature-fast' | 'creature-strong' | 'creature-premium';

export type TaskClass =
  | 'classification'
  | 'rewrite_extraction_summarization'
  | 'planning_research_synthesis'
  | 'high_impact_drafting';

export const POLICY_VERSION = 'D9-2026-07-20';

export interface ModelPolicy {
  readonly policyVersion: typeof POLICY_VERSION;
  readonly alias: ModelAlias;
  /** Compatibility name for callers that previously consumed a model string. */
  readonly defaultModel: ModelAlias;
  readonly allowedModels: readonly ModelAlias[];
  readonly spendLimit: number;
  /** Gateway fallback attempts retain this alias while changing provider internally. */
  readonly fallbackModels: readonly ModelAlias[];
}

export interface WorkspacePolicyOverride {
  /** Workspace and plan policies may lower, but never raise, the D9 ceiling. */
  readonly spendLimit?: number;
}

const createPolicy = (alias: ModelAlias, spendLimit: number): ModelPolicy => ({
  policyVersion: POLICY_VERSION,
  alias,
  defaultModel: alias,
  allowedModels: [alias],
  spendLimit,
  fallbackModels: [alias],
});

export const defaultPolicy: Readonly<Record<TaskClass, ModelPolicy>> = {
  classification: createPolicy('creature-fast', 0.02),
  rewrite_extraction_summarization: createPolicy('creature-fast', 0.02),
  planning_research_synthesis: createPolicy('creature-strong', 0.30),
  high_impact_drafting: createPolicy('creature-premium', 1.50),
};

/** Returns an immutable D9 snapshot with an optional lower workspace ceiling. */
export function getPolicyForTaskClass(
  taskClass: TaskClass,
  workspacePolicy: WorkspacePolicyOverride = {},
): ModelPolicy {
  const base = defaultPolicy[taskClass];
  const override = workspacePolicy.spendLimit;
  const spendLimit = override === undefined ? base.spendLimit : Math.min(base.spendLimit, override);

  return { ...base, spendLimit };
}
