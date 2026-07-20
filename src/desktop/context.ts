/** Services made available to the renderer after the desktop shell starts. */
export interface DesktopContext {
  readonly nativeLoaded: boolean;
  readonly credentials: CredentialManager;
  readonly cache: LocalCache;
  readonly queue: OfflineQueue;
  readonly tray: SystemTray;
  readonly notifications: NotificationService;
  readonly dialogs: DialogService;
  readonly clipboard: ClipboardService;
}

export interface CredentialManager {
  getMasterKey(): Promise<string>;
}

export interface LocalCache {
  get(key: string): Promise<unknown | undefined>;
  set(key: string, value: unknown): Promise<void>;
}

export interface OfflineQueue {
  readonly pendingCount: number;
  enqueue(operation: unknown): Promise<void>;
}

export interface SystemTray {
  show(): Promise<void>;
  destroy(): Promise<void>;
}

export interface NotificationService {
  notify(title: string, body: string): Promise<void>;
}

export interface DialogService {
  showError(title: string, message: string): Promise<void>;
}

export interface ClipboardService {
  readText(): Promise<string>;
  writeText(text: string): Promise<void>;
}

let desktopContext: DesktopContext | undefined;

export function getDesktopContext(): DesktopContext {
  if (!desktopContext) {
    throw new Error("Desktop context has not been initialized.");
  }

  return desktopContext;
}

export function setDesktopContext(context: DesktopContext | undefined): void {
  desktopContext = context;
}
