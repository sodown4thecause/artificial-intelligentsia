import type { EditableDocumentVersion } from "../../documents/types.js";

interface VersionHistoryProps {
  readonly versions: readonly EditableDocumentVersion[];
  readonly currentVersion: number;
  readonly onRestore: (versionNumber: number) => void;
  readonly confirmRestore?: (version: EditableDocumentVersion) => boolean;
  readonly disabled?: boolean;
}

export function VersionHistory({ versions, currentVersion, onRestore, confirmRestore = () => true, disabled = false }: VersionHistoryProps) {
  return <section aria-label="Version history">
    <h2>Version history</h2>
    <ol>
      {[...versions].sort((left, right) => right.versionNumber - left.versionNumber).map((version) => <li key={version.id}>
        <strong>Version {version.versionNumber}</strong> <span>{version.changeSummary ?? "Saved changes"}</span>
        <time dateTime={version.createdAt}>{new Date(version.createdAt).toLocaleString()}</time>
        <button type="button" disabled={disabled || version.versionNumber === currentVersion} onClick={() => {
          if (confirmRestore(version)) onRestore(version.versionNumber);
        }}>Restore</button>
      </li>)}
    </ol>
  </section>;
}
