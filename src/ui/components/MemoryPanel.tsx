import { useState } from "react";
import type { MemoryInspector } from "../../memory/inspection.js";
import type { MemoryItem, MemoryScope, MemoryType } from "../../memory/types.js";
import { MemoryItemEditor, MemoryTypeFilter } from "./MemoryItemEditor.js";

export interface MemoryPanelProps {
  readonly inspector: MemoryInspector;
  readonly scope: MemoryScope;
}

export function MemoryPanel({ inspector, scope }: MemoryPanelProps) {
  const [items, setItems] = useState<readonly MemoryItem[]>(inspector.review(scope));
  const [editing, setEditing] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<MemoryType | "">("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const refresh = () => setItems(inspector.review(scope, { pinned: showPinnedOnly || undefined, type: typeFilter || undefined }));
  const handleDelete = (id: string) => { inspector.delete(id); refresh(); };
  const handlePin = (id: string, pinned: boolean) => { inspector.pin(id, pinned); refresh(); };
  const handleSave = (id: string, content: string, nextScope: MemoryScope) => { inspector.correct(id, content); inspector.setScope(id, nextScope); setEditing(undefined); refresh(); };
  const handleExport = () => { window.alert(`Exported ${inspector.export(scope).length} items`); };
  const handleDisableAll = () => { inspector.disableAll(scope); refresh(); };
  const filtered = inspector.review(scope, { pinned: showPinnedOnly || undefined, type: typeFilter || undefined });
  return <section aria-label="Memory panel">
    <h2>Memory</h2>
    <MemoryTypeFilter value={typeFilter} onChange={(type) => { setTypeFilter(type); refresh(); }} />
    <label><input type="checkbox" checked={showPinnedOnly} onChange={(event) => { setShowPinnedOnly(event.target.checked); refresh(); }} /> Pinned only</label>
    <button type="button" onClick={handleExport}>Export</button>
    <button type="button" onClick={handleDisableAll}>Disable all</button>
    <ul>{filtered.map((item) => <li key={item.id}>
      <strong>{item.type}</strong>: {item.content}
      <button type="button" onClick={() => handlePin(item.id, !item.pinned)}>{item.pinned ? "Unpin" : "Pin"}</button>
      <button type="button" onClick={() => setEditing(item.id)}>Edit</button>
      <button type="button" onClick={() => handleDelete(item.id)}>Delete</button>
      {editing === item.id && <MemoryItemEditor item={item} onSave={handleSave} onCancel={() => setEditing(undefined)} />}
    </li>)}</ul>
    {filtered.length === 0 && <p>No memory items.</p>}
  </section>;
}
