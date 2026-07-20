import { useCallback, useEffect, useState } from "react";
import type { MemoryInspector } from "../../memory/inspection.js";
import type { MemoryItem, MemoryScope, MemoryType } from "../../memory/types.js";

export function useMemory(inspector: MemoryInspector, scope: MemoryScope) {
  const [items, setItems] = useState<readonly MemoryItem[]>([]);
  const refresh = useCallback(() => setItems(inspector.review(scope)), [inspector, scope]);
  useEffect(() => { refresh(); }, [refresh]);
  const correct = useCallback((id: string, content: string) => { inspector.correct(id, content); refresh(); }, [inspector, refresh]);
  const pin = useCallback((id: string, pinned: boolean) => { inspector.pin(id, pinned); refresh(); }, [inspector, refresh]);
  const setScope = useCallback((id: string, nextScope: MemoryScope) => { inspector.setScope(id, nextScope); refresh(); }, [inspector, refresh]);
  const deleteItem = useCallback((id: string) => { inspector.delete(id); refresh(); }, [inspector, refresh]);
  const exportItems = useCallback(() => inspector.export(scope), [inspector, scope]);
  const disableType = useCallback((type: MemoryType) => { inspector.disableType(type, scope); refresh(); }, [inspector, scope, refresh]);
  const enableType = useCallback((type: MemoryType) => { inspector.enableType(type, scope); refresh(); }, [inspector, scope, refresh]);
  const disableAll = useCallback(() => { inspector.disableAll(scope); refresh(); }, [inspector, scope, refresh]);
  const enableAll = useCallback(() => { inspector.enableAll(scope); refresh(); }, [inspector, scope, refresh]);
  return { items, refresh, correct, pin, setScope, delete: deleteItem, export: exportItems, disableType, enableType, disableAll, enableAll };
}
