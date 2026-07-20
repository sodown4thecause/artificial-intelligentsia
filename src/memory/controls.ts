import type { MemoryStore } from "./store.js";
import type { MemoryItem, MemoryScope, MemoryType } from "./types.js";

/** User-facing controls. Every operation is type-agnostic by design. */
export class MemoryControls {
  public constructor(private readonly store: MemoryStore) {}

  review(scope?: MemoryScope): MemoryItem[] {
    return this.store.review(scope);
  }

  correct(id: string, content: string): MemoryItem | undefined {
    return this.store.update(id, { content });
  }

  pin(id: string, pinned = true): MemoryItem | undefined {
    return this.store.setPinned(id, pinned);
  }

  scope(id: string, nextScope: MemoryScope): MemoryItem | undefined {
    return this.store.setScope(id, nextScope);
  }

  disable(type: MemoryType, scope: MemoryScope): void {
    this.store.setCategoryDisabled(scope, type, true);
  }

  enable(type: MemoryType, scope: MemoryScope): void {
    this.store.setCategoryDisabled(scope, type, false);
  }

  delete(id: string): boolean {
    return this.store.delete(id);
  }

  export(scope?: MemoryScope): MemoryItem[] {
    return this.store.export(scope);
  }

  disableAll(scope: MemoryScope): void {
    this.store.setDisabled(scope, true);
  }

  enableAll(scope: MemoryScope): void {
    this.store.setDisabled(scope, false);
  }
}
