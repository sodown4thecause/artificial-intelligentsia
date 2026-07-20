import type { FeatureFlagDefinition } from './types.js';

/**
 * Risky capabilities remain off until explicitly enabled through scoped
 * configuration. Add new production-risk capabilities to this registry.
 */
export const FEATURE_FLAGS = {
  TOOL_WRITE_ACTIONS: {
    name: 'tool.write-actions',
    kind: 'tool',
    description: 'Allows tools to perform external write actions.',
    defaultEnabled: false,
  },
  MODEL_AUTONOMOUS_POLICY: {
    name: 'model.autonomous-policy',
    kind: 'model-policy',
    description: 'Allows model-selected policy actions without per-action approval.',
    defaultEnabled: false,
  },
  CONNECTOR_WRITE_SYNC: {
    name: 'connector.write-sync',
    kind: 'connector',
    description: 'Allows connectors to write data to third-party services.',
    defaultEnabled: false,
  },
  AUTOMATION_AUTO_SEND: {
    name: 'automation.auto-send',
    kind: 'automation-mode',
    description: 'Allows approved automations to send messages without review.',
    defaultEnabled: false,
  },
  ROLLOUT_EARLY_ACCESS: {
    name: 'rollout.early-access',
    kind: 'rollout-cohort',
    description: 'Enables early-access functionality for explicitly configured cohorts.',
    defaultEnabled: false,
  },
} as const satisfies Record<string, FeatureFlagDefinition>;

export const RISKY_FEATURE_FLAGS: readonly FeatureFlagDefinition[] = Object.values(FEATURE_FLAGS);

export type RiskyFeatureFlagName = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS]['name'];
