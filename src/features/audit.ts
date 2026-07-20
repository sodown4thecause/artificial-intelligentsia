import type { FeatureFlagChange } from './types.js';

/** Persistence boundary for feature flag administration audit records. */
export interface FeatureFlagAuditLog {
  record(change: FeatureFlagChange): void;
  list(): readonly FeatureFlagChange[];
}

/** An append-only audit log suitable for local and test environments. */
export class InMemoryFeatureFlagAuditLog implements FeatureFlagAuditLog {
  private readonly changes: FeatureFlagChange[] = [];

  record(change: FeatureFlagChange): void {
    this.changes.push(Object.freeze({ ...change }));
  }

  list(): readonly FeatureFlagChange[] {
    return this.changes.map((change) => Object.freeze({ ...change }));
  }
}
