import { NativeCache } from "./bridge.js";

export class LocalCache {
  constructor(private readonly cache = new NativeCache()) {}

  getDocument<T = unknown>(id: string): T | undefined { return this.get(`document:${id}`); }
  setDocument(id: string, content: unknown): void { this.set(`document:${id}`, content); }
  getMessageMetadata<T = unknown>(id: string): T | undefined { return this.get(`message:${id}`); }
  setMessageMetadata(id: string, metadata: unknown): void { this.set(`message:${id}`, metadata); }
  getDraft<T = unknown>(id: string): T | undefined { return this.get(`draft:${id}`); }
  setDraft(id: string, draft: unknown): void { this.set(`draft:${id}`, draft); }
  getPreference<T = unknown>(key: string): T | undefined { return this.get(`preference:${key}`); }
  setPreference(key: string, value: unknown): void { this.set(`preference:${key}`, value); }
  delete(key: string): void { this.cache.delete(key); }

  private get<T>(key: string): T | undefined {
    const value = this.cache.get(key);
    return value === undefined ? undefined : JSON.parse(value) as T;
  }

  private set(key: string, value: unknown): void {
    this.cache.set(key, JSON.stringify(value));
  }
}
