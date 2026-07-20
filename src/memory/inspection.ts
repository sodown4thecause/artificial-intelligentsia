import type { MemoryControls } from "./controls.js";
import type { MemoryItem, MemoryScope, MemoryType } from "./types.js";

export interface MemoryInspectionFilters {
  readonly pinned?: boolean;
  readonly disabled?: boolean;
  readonly type?: MemoryType;
}

export class MemoryInspector {
  public constructor(private readonly controls: MemoryControls) {}

  public review(scope?: MemoryScope, filters?: MemoryInspectionFilters): readonly MemoryItem[] {
    const items = scope ? this.controls.retrieve(scope) : this.controls.review(scope);
    return items.filter((item) => {
      if (filters?.pinned !== undefined && item.pinned !== filters.pinned) return false;
      if (filters?.type !== undefined && item.type !== filters.type) return false;
      return true;
    });
  }

  public correct(id: string, content: string): MemoryItem | undefined {
    return this.controls.correct(id, content);
  }

  public pin(id: string, pinned = true): MemoryItem | undefined {
    return this.controls.pin(id, pinned);
  }

  public setScope(id: string, scope: MemoryScope): MemoryItem | undefined {
    return this.controls.scope(id, scope);
  }

  public delete(id: string): boolean {
    return this.controls.delete(id);
  }

  public export(scope?: MemoryScope): readonly MemoryItem[] {
    return this.controls.export(scope);
  }

  public disableType(type: MemoryType, scope: MemoryScope): void {
    this.controls.disable(type, scope);
  }

  public enableType(type: MemoryType, scope: MemoryScope): void {
    this.controls.enable(type, scope);
  }

  public disableAll(scope: MemoryScope): void {
    this.controls.disableAll(scope);
  }

  public enableAll(scope: MemoryScope): void {
    this.controls.enableAll(scope);
  }
}
