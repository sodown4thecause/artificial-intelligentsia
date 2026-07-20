import assert from "node:assert/strict";
import test from "node:test";

import {
  createBackupManifest,
  createRestorePlan,
  isBackupManifest,
  validateBackupManifest,
} from "../../src/retention/backup.js";
import { defaultRetentionPolicy } from "../../src/retention/policy.js";
import { retentionCategories } from "../../src/retention/types.js";

test("default retention policy covers every protected data category", () => {
  assert.deepEqual(Object.keys(defaultRetentionPolicy).sort(), [...retentionCategories].sort());
  assert.equal(defaultRetentionPolicy.memory.durationDays, null);
  assert.equal(defaultRetentionPolicy["audit-references"].durationDays, 2555);
});

test("backup manifests validate and produce a restore plan", () => {
  const manifest = createBackupManifest({
    id: "backup-2026-07-20",
    createdAt: "2026-07-20T12:00:00.000Z",
    workspaceId: "workspace-1",
    schemaVersion: "1",
    entries: [
      {
        category: "attachments",
        path: "attachments/photo.png",
        checksum: "sha256:abc123",
        bytes: 128,
        records: 1,
      },
    ],
  });

  assert.equal(isBackupManifest(manifest), true);
  assert.deepEqual(createRestorePlan(manifest), {
    manifestId: "backup-2026-07-20",
    workspaceId: "workspace-1",
    schemaVersion: "1",
    entries: manifest.entries,
  });
});

test("restore rejects manifests with unsafe archive paths", () => {
  const result = validateBackupManifest({
    format: "creature-os-backup",
    version: 1,
    id: "backup-1",
    createdAt: "2026-07-20T12:00:00.000Z",
    workspaceId: "workspace-1",
    schemaVersion: "1",
    entries: [
      {
        category: "exports",
        path: "../outside.json",
        checksum: "sha256:abc123",
        bytes: 1,
        records: 1,
      },
    ],
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /relative backup entries/);
});
