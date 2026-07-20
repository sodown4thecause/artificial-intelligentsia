# Backup, restore, and retention

Creature backup archives must include a JSON manifest produced by
`createBackupManifest`. The archive writer is responsible for storing each
listed relative path and calculating the entry checksum.

## Backup procedure

1. Quiesce writes for the workspace or take a consistent database snapshot.
2. Export attachments, version history, memory, audit references, and generated
   exports to relative paths in an archive staging directory.
3. Calculate a checksum, byte count, and record count for every exported path.
4. Create and store `manifest.json` with `createBackupManifest`, using the
   workspace ID, the data schema version, and the supplied entry metadata.
5. Encrypt the finished archive in transit and at rest, then record its storage
   location separately from the archive.
6. Periodically test a restore into an isolated workspace.

## Restore procedure

1. Obtain the archive through an authorized recovery process and decrypt it in
   an isolated restore environment.
2. Parse `manifest.json` and call `validateBackupManifest`. Do not restore an
   invalid manifest.
3. Create a restore plan with `createRestorePlan`.
4. For every planned entry, reject absolute or parent-directory paths, verify
   its checksum and byte count during extraction, and import it into the target
   workspace.
5. Verify record counts, application health, and access controls before making
   the restored workspace available.

`createRestorePlan` intentionally does not read files or mutate storage. The
storage adapter must enforce checksum verification and target-workspace access
control before importing data.

## Default retention rules

| Category | Default | Action |
| --- | --- | --- |
| Attachments | 90 days | Delete unreferenced binaries |
| Versions | 365 days | Archive |
| Memory | Until explicitly deleted | Delete on request |
| Audit references | 2,555 days (seven years) | Archive |
| Exports | 30 days | Delete |

Legal, security, or customer obligations may require a deployment-specific
policy that is longer than these defaults. Retention changes apply prospectively
and should be recorded with the backup manifest used for recovery.
