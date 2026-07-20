import { LocalCache } from "../../native/cache.js";
import type { ChatThread } from "./types.js";

export interface ChatStore {
  load(id: string): ChatThread | undefined;
  save(thread: ChatThread): void;
  list(): ChatThread[];
  delete(id: string): void;
}

export class InMemoryChatStore implements ChatStore {
  private readonly threads = new Map<string, ChatThread>();

  load(id: string): ChatThread | undefined {
    const thread = this.threads.get(id);
    return thread === undefined ? undefined : structuredClone(thread);
  }

  save(thread: ChatThread): void {
    this.threads.set(thread.id, structuredClone(thread));
  }

  list(): ChatThread[] {
    return [...this.threads.values()]
      .map((thread) => structuredClone(thread))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  delete(id: string): void {
    this.threads.delete(id);
  }
}

/** Stores threads in the same native cache used by durable runs. */
export class NativeCacheChatStore implements ChatStore {
  private static readonly indexId = "chat:thread-index";

  constructor(private readonly cache: LocalCache = new LocalCache()) {}

  load(id: string): ChatThread | undefined {
    return this.cache.getAgentRun<ChatThread>(`chat:thread:${id}`);
  }

  save(thread: ChatThread): void {
    this.cache.setAgentRun(`chat:thread:${thread.id}`, thread);
    const ids = this.cache.getAgentRun<string[]>(NativeCacheChatStore.indexId) ?? [];
    if (!ids.includes(thread.id)) {
      this.cache.setAgentRun(NativeCacheChatStore.indexId, [...ids, thread.id]);
    }
  }

  list(): ChatThread[] {
    const ids = this.cache.getAgentRun<string[]>(NativeCacheChatStore.indexId) ?? [];
    return ids
      .map((id) => this.load(id))
      .filter((thread): thread is ChatThread => thread !== undefined)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  delete(id: string): void {
    const ids = this.cache.getAgentRun<string[]>(NativeCacheChatStore.indexId) ?? [];
    this.cache.setAgentRun(NativeCacheChatStore.indexId, ids.filter((value) => value !== id));
  }
}
