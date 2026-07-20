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
import { deriveCacheMasterKey, loadNativeLib, NativeCache } from "../native/bridge.js";
import { OfflineQueue as NativeOfflineQueue } from "../native/queue.js";
import { ShortcutModifiers, ShortcutService } from "../native/shortcuts.js";
import { createDevelopmentAuthProvider } from "../auth/provider.js";
import { CredentialSessionStore, type OsCredentialService, SessionManager } from "../auth/session.js";
import { WorkspaceSelectionController } from "../auth/workspace.js";

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
  return {
    async getMasterKey(): Promise<string> {
      // The current Native SDK exposes cache primitives but not an OS credential API.
      // Until that API is available, require an installation-provisioned secret and
      // derive a cache-specific key from it rather than persisting a fallback key.
      const credential = process.env.CREATURE_CACHE_MASTER_KEY;
      if (!credential?.trim()) {
        throw new Error("No secure credential source is configured for the local cache");
      }
      return deriveCacheMasterKey(credential);
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

/** Development fallback only; production shells must provide an OS credential-manager adapter. */
class VolatileCredentialService implements OsCredentialService {
  private readonly credentials = new Map<string, string>();

  async getPassword(service: string, account: string): Promise<string | undefined> {
    return this.credentials.get(`${service}:${account}`);
  }

  async setPassword(service: string, account: string, password: string): Promise<void> {
    this.credentials.set(`${service}:${account}`, password);
  }

  async deletePassword(service: string, account: string): Promise<void> {
    this.credentials.delete(`${service}:${account}`);
  }
}

function createDesktopAuthentication(): WorkspaceSelectionController {
  const provider = createDevelopmentAuthProvider({
    user: { id: "development-user", email: "developer@creature.local", displayName: "Developer" },
    workspaces: [{ id: "development-workspace", name: "Development", slug: "development" }],
    memberships: [{ userId: "development-user", workspaceId: "development-workspace", role: "owner", status: "active" }],
  });
  return new WorkspaceSelectionController(new SessionManager(provider, new CredentialSessionStore(new VolatileCredentialService())));
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
  desktopAuthentication = createDesktopAuthentication();
  await desktopAuthentication.restore();
  await onAppReady();
  registerGlobalKeyboardShortcuts();
  return context;
}

let desktopAuthentication: WorkspaceSelectionController | undefined;

/** Returns the desktop authentication boundary after bootstrap. */
export function getDesktopAuthentication(): WorkspaceSelectionController | undefined {
  return desktopAuthentication;
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
