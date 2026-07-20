import { containsSecret } from "../core/redaction/secrets.js";
import { isApprovedCandidate } from "./candidate.js";
import type {
  MemoryCandidate,
  MemoryCategorySetting,
  MemoryItem,
  MemoryRetrievalRequest,
  MemoryScope,
  MemoryType,
  MemoryWriteResult,
} from "./types.js";

/**
 * The repository is the sole backing store for this boundary. Consumers must
 * provide one; there is no module-level or hidden secondary memory store.
 */
export interface MemoryRepository {
  list(): readonly MemoryItem[];
  get(id: string): MemoryItem | undefined;
  save(item: MemoryItem): void;
  remove(id: string): void;
}

/** A deliberately explicit in-memory repository suitable for tests and local prototypes. */
export class InMemoryMemoryRepository implements MemoryRepository {
  private readonly items = new Map<string, MemoryItem>();

  list(): readonly MemoryItem[] {
    return [...this.items.values()].map(cloneItem);
  }

  get(id: string): MemoryItem | undefined {
    const item = this.items.get(id);
    return item ? cloneItem(item) : undefined;
  }

  save(item: MemoryItem): void {
    this.items.set(item.id, cloneItem(item));
  }

  remove(id: string): void {
    this.items.delete(id);
  }
}

export class MemoryStore {
  private readonly categorySettings: MemoryCategorySetting[] = [];

  public constructor(
    private readonly repository: MemoryRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  retrieve(request: MemoryRetrievalRequest): MemoryItem[] {
    if (this.isDisabled(request)) return [];

    return this.repository
      .list()
      .filter((item) => scopeApplies(item.scope, request) && !this.isCategoryDisabled(item.type, request));
  }

  review(scope?: MemoryScope): MemoryItem[] {
    return this.repository.list().filter((item) => !scope || scopeApplies(item.scope, scope));
  }

  writeCandidate(candidate: MemoryCandidate): MemoryWriteResult {
    if (!isApprovedCandidate(candidate)) {
      return { status: "rejected", reason: "Memory candidates require explicit user or policy approval." };
    }
    if (containsSecret(candidate.content) || containsSecret(candidate.provenance.reference ?? "")) {
      return { status: "rejected", reason: "Sensitive content cannot be stored in memory." };
    }
    if (this.isDisabled(candidate.scope) || this.isCategoryDisabled(candidate.type, candidate.scope)) {
      return { status: "rejected", reason: "Memory is disabled for this scope or category." };
    }

    const scopedItems = this.repository.list().filter((item) => item.type === candidate.type && sameScope(item.scope, candidate.scope));
    const duplicate = scopedItems.find((item) => normalize(item.content) === normalize(candidate.content));
    if (duplicate) return { status: "duplicate", item: duplicate };

    const conflict = scopedItems.find((item) => normalize(item.content) !== normalize(candidate.content));
    if (conflict) return { status: "conflict", conflictingItem: conflict };

    const timestamp = this.now().toISOString();
    const item: MemoryItem = {
      id: candidate.id,
      type: candidate.type,
      content: candidate.content,
      scope: { ...candidate.scope },
      provenance: { ...candidate.provenance },
      pinned: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.repository.save(item);
    return { status: "created", item };
  }

  update(id: string, update: Pick<MemoryItem, "content">): MemoryItem | undefined {
    if (containsSecret(update.content)) throw new Error("Sensitive content cannot be stored in memory.");
    const item = this.requireItem(id);
    if (!item) return undefined;
    const changed = { ...item, content: update.content, updatedAt: this.now().toISOString() };
    this.repository.save(changed);
    return changed;
  }

  setPinned(id: string, pinned: boolean): MemoryItem | undefined {
    const item = this.requireItem(id);
    if (!item) return undefined;
    const changed = { ...item, pinned, updatedAt: this.now().toISOString() };
    this.repository.save(changed);
    return changed;
  }

  setScope(id: string, scope: MemoryScope): MemoryItem | undefined {
    const item = this.requireItem(id);
    if (!item) return undefined;
    const changed = { ...item, scope: { ...scope }, updatedAt: this.now().toISOString() };
    this.repository.save(changed);
    return changed;
  }

  delete(id: string): boolean {
    if (!this.repository.get(id)) return false;
    this.repository.remove(id);
    return true;
  }

  export(scope?: MemoryScope): MemoryItem[] {
    return this.review(scope);
  }

  setCategoryDisabled(scope: MemoryScope, type: MemoryType, disabled: boolean): void {
    this.setSetting({ scope, type, disabled });
  }

  setDisabled(scope: MemoryScope, disabled: boolean): void {
    this.setSetting({ scope, disabled });
  }

  private setSetting(next: MemoryCategorySetting): void {
    const index = this.categorySettings.findIndex((setting) => setting.type === next.type && sameScope(setting.scope, next.scope));
    if (index === -1) this.categorySettings.push({ ...next, scope: { ...next.scope } });
    else this.categorySettings[index] = { ...next, scope: { ...next.scope } };
  }

  private isDisabled(scope: MemoryScope): boolean {
    return this.categorySettings.some((setting) => setting.type === undefined && setting.disabled && scopeApplies(setting.scope, scope));
  }

  private isCategoryDisabled(type: MemoryType, scope: MemoryScope): boolean {
    return this.categorySettings.some((setting) => setting.type === type && setting.disabled && scopeApplies(setting.scope, scope));
  }

  private requireItem(id: string): MemoryItem | undefined {
    return this.repository.get(id);
  }
}

function scopeApplies(memoryScope: MemoryScope, request: MemoryScope): boolean {
  return memoryScope.userId === request.userId
    && optionalScopeFieldMatches(memoryScope.workspaceId, request.workspaceId)
    && optionalScopeFieldMatches(memoryScope.projectId, request.projectId)
    && optionalScopeFieldMatches(memoryScope.taskId, request.taskId)
    && optionalScopeFieldMatches(memoryScope.purpose, request.purpose);
}

function optionalScopeFieldMatches(memoryValue: string | undefined, requestValue: string | undefined): boolean {
  return memoryValue === undefined || memoryValue === requestValue;
}

function sameScope(left: MemoryScope, right: MemoryScope): boolean {
  return left.userId === right.userId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.taskId === right.taskId
    && left.purpose === right.purpose;
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function cloneItem(item: MemoryItem): MemoryItem {
  return { ...item, scope: { ...item.scope }, provenance: { ...item.provenance } };
}
