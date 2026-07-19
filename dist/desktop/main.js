import { setDesktopContext, } from "./context.js";
import { onAppReady } from "./lifecycle.js";
import { loadNativeLib, NativeCache } from "../native/bridge.js";
import { OfflineQueue as NativeOfflineQueue } from "../native/queue.js";
class DesktopCache {
    cache;
    constructor(cache) {
        this.cache = cache;
    }
    async get(key) {
        const value = this.cache.get(key);
        return value === undefined ? undefined : JSON.parse(value);
    }
    async set(key, value) {
        this.cache.set(key, JSON.stringify(value));
    }
}
class DesktopOfflineQueue {
    queue;
    constructor(queue) {
        this.queue = queue;
    }
    get pendingCount() {
        return this.queue.pendingCount();
    }
    async enqueue(operation) {
        this.queue.enqueue("connector_sync", operation);
    }
}
function createCredentialManager() {
    const masterKey = process.env.CREATURE_CACHE_MASTER_KEY ?? "creature-local-fallback";
    return {
        async getMasterKey() {
            // Electron/Tauri adapters may replace this implementation with the OS keychain.
            return masterKey;
        },
    };
}
function createPlatformServices() {
    const tray = {
        async show() { },
        async destroy() { },
    };
    const notifications = {
        async notify() { },
    };
    const dialogs = {
        async showError() { },
    };
    const clipboard = {
        async readText() {
            return "";
        },
        async writeText() { },
    };
    return { tray, notifications, dialogs, clipboard };
}
/**
 * Initializes desktop services. Native bindings are optional so browser previews,
 * tests, and installations without a compiled Zig library remain usable.
 */
export async function bootstrapDesktop() {
    const native = loadNativeLib();
    const credentials = createCredentialManager();
    const masterKey = await credentials.getMasterKey();
    const context = {
        nativeLoaded: native !== undefined,
        credentials,
        cache: new DesktopCache(new NativeCache({ masterKey, native })),
        queue: new DesktopOfflineQueue(new NativeOfflineQueue()),
        ...createPlatformServices(),
    };
    setDesktopContext(context);
    await onAppReady();
    registerGlobalKeyboardShortcuts();
    return context;
}
/** Reserved integration point for PR 6 keyboard shortcut registration. */
export function registerGlobalKeyboardShortcuts() { }
//# sourceMappingURL=main.js.map