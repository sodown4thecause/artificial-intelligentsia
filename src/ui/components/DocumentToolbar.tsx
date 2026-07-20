interface DocumentToolbarProps {
  readonly saveStatus: "idle" | "saving" | "saved" | "error";
  readonly onSave: () => void;
  readonly onShowVersions: () => void;
  readonly disabled?: boolean;
}

export function DocumentToolbar({ saveStatus, onSave, onShowVersions, disabled = false }: DocumentToolbarProps) {
  const status = saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : "Unsaved changes";
  return <div role="toolbar" aria-label="Document actions">
    <span role="status">{status}</span>
    <button type="button" onClick={onSave} disabled={disabled || saveStatus === "saving"}>Save</button>
    <button type="button" onClick={onShowVersions} disabled={disabled}>Version history</button>
  </div>;
}
