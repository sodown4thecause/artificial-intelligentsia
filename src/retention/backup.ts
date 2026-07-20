import { defaultRetentionPolicy } from "./policy.js";
import {
  retentionCategories,
  type BackupEntry,
  type BackupManifest,
  type CreateBackupManifestInput,
  type ManifestValidationResult,
  type RestorePlan,
  type RetentionCategory,
} from "./types.js";

const isRetentionCategory = (value: unknown): value is RetentionCategory =>
  typeof value === "string" && retentionCategories.includes(value as RetentionCategory);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isValidDate = (value: unknown): value is string =>
  isNonEmptyString(value) && !Number.isNaN(Date.parse(value));

const isBackupEntry = (value: unknown): value is BackupEntry => {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    isRetentionCategory(entry.category) &&
    isNonEmptyString(entry.path) &&
    !entry.path.startsWith("/") &&
    !entry.path.split("/").includes("..") &&
    isNonEmptyString(entry.checksum) &&
    typeof entry.bytes === "number" &&
    Number.isFinite(entry.bytes) &&
    entry.bytes >= 0 &&
    Number.isInteger(entry.bytes) &&
    typeof entry.records === "number" &&
    Number.isFinite(entry.records) &&
    entry.records >= 0 &&
    Number.isInteger(entry.records)
  );
};

/** Creates a portable manifest; archive writing and checksum calculation stay external. */
export const createBackupManifest = (
  input: CreateBackupManifestInput,
): BackupManifest => {
  const manifest: BackupManifest = {
    format: "creature-os-backup",
    version: 1,
    id: input.id,
    createdAt: input.createdAt,
    workspaceId: input.workspaceId,
    schemaVersion: input.schemaVersion,
    entries: input.entries.map((entry) => ({ ...entry })),
    retentionPolicy: input.retentionPolicy ?? defaultRetentionPolicy,
  };

  const validation = validateBackupManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Invalid backup manifest: ${validation.errors.join("; ")}`);
  }

  return manifest;
};

/** Validates untrusted JSON before an archive is restored. */
export const validateBackupManifest = (
  value: unknown,
): ManifestValidationResult => {
  const errors: string[] = [];
  if (value === null || typeof value !== "object") {
    return { valid: false, errors: ["manifest must be an object"] };
  }

  const manifest = value as Record<string, unknown>;
  if (manifest.format !== "creature-os-backup") errors.push("unsupported format");
  if (manifest.version !== 1) errors.push("unsupported manifest version");
  if (!isNonEmptyString(manifest.id)) errors.push("id is required");
  if (!isValidDate(manifest.createdAt)) errors.push("createdAt must be an ISO date");
  if (!isNonEmptyString(manifest.workspaceId)) errors.push("workspaceId is required");
  if (!isNonEmptyString(manifest.schemaVersion)) errors.push("schemaVersion is required");
  if (!Array.isArray(manifest.entries) || !manifest.entries.every(isBackupEntry)) {
    errors.push("entries must contain valid, relative backup entries");
  }

  return { valid: errors.length === 0, errors };
};

export const isBackupManifest = (value: unknown): value is BackupManifest =>
  validateBackupManifest(value).valid;

/**
 * Produces the exact set of verified entries that a restore worker may apply.
 * Callers should verify each entry's checksum while extracting it.
 */
export const createRestorePlan = (manifest: unknown): RestorePlan => {
  const validation = validateBackupManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Cannot restore backup: ${validation.errors.join("; ")}`);
  }

  const validManifest = manifest as BackupManifest;
  return {
    manifestId: validManifest.id,
    workspaceId: validManifest.workspaceId,
    schemaVersion: validManifest.schemaVersion,
    entries: validManifest.entries.map((entry) => ({ ...entry })),
  };
};
