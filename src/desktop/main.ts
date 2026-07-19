import {
  type ClipboardService,
  type CredentialManager,
  type DesktopContext,
  type DialogService,
  type LocalCache,
  type NotificationService,
  type OfflineQueue,
  type SystemTray,
  setDesktopContext,
} from "./context.js";
import { onAppReady } from "./lifecycle.js";
import { loadNativeLib, NativeCache } from "../native/bridge.js";
import { OfflineQueue as NativeOfflineQueue } from "../native/queue.js";
import { ShortcutModifiers, ShortcutService } from "../native/shortcuts.js";

class DesktopCache implements LocalCache {
  constructor(private readonly cache: NativeCache) {}

  async get(key: string): Promise<unknown | undefined> {
    const value = this.cache.get(key);
    return value === undefined ? undefined : JSON.parse(value);
  }

  async set(key: string, value: unknown): Promise<void> {
    this.cache.set(key, JSON.stringify(value));
  }
}

class DesktopOfflineQueue implements OfflineQueue {
  constructor(private readonly queue: NativeOfflineQueue) {}

  get pendingCount(): number {
    return this.queue.pendingCount();
  }

  async enqueue(operation: unknown): Promise<void> {
    this.queue.enqueue("connector_sync", operation);
  }
}

function createCredentialManager(): CredentialManager {
  const masterKey = process.env.CREATURE_CACHE_MASTER_KEY ?? "creature-local-fallback";

  return {
    async getMasterKey(): Promise<string> {
      // Electron/Tauri adapters may replace this implementation with the OS keychain.
      return masterKey;
    },
  };
}

function createPlatformServices(): Pick<DesktopContext, "tray" | "notifications" | "dialogs" | "clipboard"> {
  const tray: SystemTray = {
    async show(): Promise<void> {},
    async destroy(): Promise<void> {},
  };
  const notifications: NotificationService = {
    async notify(): Promise<void> {},
  };
  const dialogs: DialogService = {
    async showError(): Promise<void> {},
  };
  const clipboard: ClipboardService = {
    async readText(): Promise<string> {
      return "";
    },
    async writeText(): Promise<void> {},
  };

  return { tray, notifications, dialogs, clipboard };
}

/**
 * Initializes desktop services. Native bindings are optional so browser previews,
 * tests, and installations without a compiled Zig library remain usable.
 */
export async function bootstrapDesktop(): Promise<DesktopContext> {
  const native = loadNativeLib();
  const credentials = createCredentialManager();
  const masterKey = await credentials.getMasterKey();
  const context: DesktopContext = {
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

let shortcutService: ShortcutService | undefined;

/**
 * Registers global keyboard shortcuts. In a real desktop shell this binds to the
 * OS-level shortcut API; in browsers it listens on the active window.
 */
export function registerGlobalKeyboardShortcuts(): void {
  shortcutService = new ShortcutService();
  shortcutService.register(ShortcutModifiers.Control, "k", "command-palette", () => {
    // Renderer processes consume this via the desktop context or a shared event bus.
    // eslint-disable-next-line no-console
    console.log("[creature] toggle command palette");
  });
}

/** Exposes the shortcut service for renderer integration and tests. */
export function getShortcutService(): ShortcutService | undefined {
  return shortcutService;
}
