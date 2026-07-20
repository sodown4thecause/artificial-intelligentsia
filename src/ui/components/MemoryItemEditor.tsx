import { useState } from "react";
import type { MemoryItem, MemoryScope, MemoryType } from "../../memory/types.js";

export interface MemoryItemEditorProps {
  readonly item: MemoryItem;
  readonly onSave: (id: string, content: string, scope: MemoryScope) => Promise<void> | void;
  readonly onCancel: () => void;
}

export function MemoryItemEditor({ item, onSave, onCancel }: MemoryItemEditorProps) {
  const [content, setContent] = useState(item.content);
  const [workspaceId, setWorkspaceId] = useState(item.scope.workspaceId ?? "");
  const [projectId, setProjectId] = useState(item.scope.projectId ?? "");
  const [purpose, setPurpose] = useState(item.scope.purpose ?? "");
  const save = () => {
    const scope: MemoryScope = { userId: item.scope.userId, workspaceId: workspaceId.trim() || undefined, projectId: projectId.trim() || undefined, purpose: purpose.trim() || undefined };
    void onSave(item.id, content.trim(), scope);
  };
  return <section aria-label="Edit memory item">
    <textarea aria-label="Memory content" value={content} onChange={(event) => setContent(event.target.value)} />
    <label>Workspace <input aria-label="Workspace" value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} /></label>
    <label>Project <input aria-label="Project" value={projectId} onChange={(event) => setProjectId(event.target.value)} /></label>
    <label>Purpose <input aria-label="Purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} /></label>
    <button type="button" onClick={save} disabled={!content.trim()}>Save</button>
    <button type="button" onClick={onCancel}>Cancel</button>
  </section>;
}

export interface MemoryTypeFilterProps {
  readonly value: MemoryType | "";
  readonly onChange: (type: MemoryType | "") => void;
}

export function MemoryTypeFilter({ value, onChange }: MemoryTypeFilterProps) {
  return <select aria-label="Memory type" value={value} onChange={(event) => onChange(event.target.value as MemoryType | "")}>
    <option value="">All types</option>
    <option value="personal-preferences">Personal preferences</option>
    <option value="writing-voice">Writing voice</option>
    <option value="communication-preferences">Communication preferences</option>
    <option value="project-context">Project context</option>
    <option value="workspace-terminology">Workspace terminology</option>
    <option value="reusable-procedures">Reusable procedures</option>
    <option value="relationship-context">Relationship context</option>
  </select>;
}
