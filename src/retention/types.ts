/** Data classes governed by Creature's retention and backup controls. */
export const retentionCategories = [
  "attachments",
  "versions",
  "memory",
  "audit-references",
  "exports",
] as const;

export type RetentionCategory = (typeof retentionCategories)[number];

export type RetentionAction = "delete" | "archive";

/**
 * `null` means the data is retained until an explicit user or administrator
 * deletion. It must not be interpreted as a zero-day retention period.
 */
export type RetentionDurationDays = number | null;

export interface RetentionRule {
  category: RetentionCategory;
  durationDays: RetentionDurationDays;
  action: RetentionAction;
  description: string;
}

export type RetentionPolicy = Readonly<
  Record<RetentionCategory, Readonly<RetentionRule>>
>;

export interface BackupEntry {
  category: RetentionCategory;
  /** A portable, relative location within the backup archive. */
  path: string;
  /** Integrity checksum recorded by the backup writer (for example SHA-256). */
  checksum: string;
  bytes: number;
  records: number;
}

export interface BackupManifest {
  format: "creature-os-backup";
  version: 1;
  id: string;
  createdAt: string;
  workspaceId: string;
  schemaVersion: string;
  entries: readonly BackupEntry[];
  retentionPolicy: RetentionPolicy;
}

export interface CreateBackupManifestInput {
  id: string;
  createdAt: string;
  workspaceId: string;
  schemaVersion: string;
  entries: readonly BackupEntry[];
  retentionPolicy?: RetentionPolicy;
}

export interface RestorePlan {
  manifestId: string;
  workspaceId: string;
  schemaVersion: string;
  entries: readonly BackupEntry[];
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: readonly string[];
}
