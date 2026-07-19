import { NativeCache } from "./bridge.js";
export class LocalCache {
    cache;
    constructor(cache = new NativeCache()) {
        this.cache = cache;
    }
    getDocument(id) { return this.get(`document:${id}`); }
    setDocument(id, content) { this.set(`document:${id}`, content); }
    getMessageMetadata(id) { return this.get(`message:${id}`); }
    setMessageMetadata(id, metadata) { this.set(`message:${id}`, metadata); }
    getDraft(id) { return this.get(`draft:${id}`); }
    setDraft(id, draft) { this.set(`draft:${id}`, draft); }
    getPreference(key) { return this.get(`preference:${key}`); }
    setPreference(key, value) { this.set(`preference:${key}`, value); }
    delete(key) { this.cache.delete(key); }
    get(key) {
        const value = this.cache.get(key);
        return value === undefined ? undefined : JSON.parse(value);
    }
    set(key, value) {
        this.cache.set(key, JSON.stringify(value));
    }
}
//# sourceMappingURL=cache.js.map