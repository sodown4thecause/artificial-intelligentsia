import type { RetentionPolicy } from "./types.js";

/**
 * Product defaults. Deployments may replace these rules, but every category
 * must remain represented so neither a backup nor a cleanup job silently
 * omits data.
 */
export const defaultRetentionPolicy: RetentionPolicy = {
  attachments: {
    category: "attachments",
    durationDays: 90,
    action: "delete",
    description: "Delete unreferenced attachment binaries after 90 days.",
  },
  versions: {
    category: "versions",
    durationDays: 365,
    action: "archive",
    description: "Archive document version history after one year.",
  },
  memory: {
    category: "memory",
    durationDays: null,
    action: "delete",
    description: "Retain workspace memory until an explicit deletion request.",
  },
  "audit-references": {
    category: "audit-references",
    durationDays: 2555,
    action: "archive",
    description: "Archive audit references for seven years.",
  },
  exports: {
    category: "exports",
    durationDays: 30,
    action: "delete",
    description: "Delete generated exports after 30 days.",
  },
};
