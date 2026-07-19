import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import koffi from "koffi";

export interface NativeLibrary {
  init(): number;
  cacheInit(path: string, masterKey: string): number;
  cacheSet(key: string, value: string): number;
  cacheGet(key: string, output: Buffer, length: Buffer): number;
  cacheDelete(key: string): number;
  cacheFreeString(pointer: unknown, length: number): void;
  queueEnqueue(type: string, payload: string): number;
  queueDequeue(output: Buffer, length: Buffer): number;
  queueMarkCompleted(id: string): number;
  queueMarkFailed(id: string, error: string): number;
  queuePendingCount(): number;
  shortcutRegister(modifiers: number, key: string, callbackId: string): number;
  shortcutUnregister(callbackId: string): number;
  shortcutUnregisterAll(): number;
}

function defaultLibraryPath(): string {
  const extension = process.platform === "win32" ? "dll" : process.platform === "darwin" ? "dylib" : "so";
  return resolve(process.cwd(), "native", "zig", "zig-out", "lib", `creature_native.${extension}`);
}

export function loadNativeLib(): NativeLibrary | undefined {
  const libraryPath = process.env.CREATURE_NATIVE_LIB_PATH ?? defaultLibraryPath();
  if (!existsSync(libraryPath)) return undefined;
  try {
    const library = koffi.load(libraryPath);
    const native: NativeLibrary = {
      init: library.func("int creature_native_init(void)"),
      cacheInit: library.func("int creature_cache_init(const char *path, const char *master_key)"),
      cacheSet: library.func("int creature_cache_set(const char *key, const char *value)"),
      cacheGet: library.func("int creature_cache_get(const char *key, void **out_value, size_t *out_len)"),
      cacheDelete: library.func("int creature_cache_delete(const char *key)"),
      cacheFreeString: library.func("void creature_cache_free_string(void *pointer, size_t length)"),
      queueEnqueue: library.func("int creature_queue_enqueue(const char *type, const char *payload)"),
      queueDequeue: library.func("int creature_queue_dequeue(void **out_operation, size_t *out_len)"),
      queueMarkCompleted: library.func("int creature_queue_mark_completed(const char *id)"),
      queueMarkFailed: library.func("int creature_queue_mark_failed(const char *id, const char *error)"),
      queuePendingCount: library.func("int creature_queue_pending_count(void)"),
      shortcutRegister: library.func("int creature_shortcut_register(unsigned int modifiers, const char *key, const char *callback_id)"),
      shortcutUnregister: library.func("int creature_shortcut_unregister(const char *callback_id)"),
      shortcutUnregisterAll: library.func("int creature_shortcut_unregister_all(void)"),
    };
    return native.init() === 0 ? native : undefined;
  } catch {
    return undefined;
  }
}

export const ShortcutModifiers = {
  Control: 1 << 0,
  Shift: 1 << 1,
  Alt: 1 << 2,
  Meta: 1 << 3,
} as const;

type ShortcutKeyEvent = {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  preventDefault(): void;
};

type ShortcutTarget = {
  addEventListener(type: "keydown", listener: (event: ShortcutKeyEvent) => void): void;
  removeEventListener(type: "keydown", listener: (event: ShortcutKeyEvent) => void): void;
};

type RegisteredShortcut = {
  modifiers: number;
  key: string;
  callback: () => void;
};

/**
 * Registers native shortcuts when the Zig library is present and otherwise
 * listens on the focused application window. The latter keeps previews and
 * test environments fully functional without native binaries.
 */
export class NativeShortcuts {
  private readonly native: NativeLibrary | undefined;
  private readonly target: ShortcutTarget | undefined;
  private readonly shortcuts = new Map<string, RegisteredShortcut>();
  private listening = false;

  constructor(options: { native?: NativeLibrary; target?: ShortcutTarget } = {}) {
    this.native = options.native ?? loadNativeLib();
    this.target = options.target ?? (typeof globalThis.addEventListener === "function" ? globalThis as unknown as ShortcutTarget : undefined);
  }

  register(modifiers: number, key: string, callbackId: string, callback: () => void): boolean {
    const normalizedKey = key.toLowerCase();
    const nativeRegistered = this.native?.shortcutRegister(modifiers, normalizedKey, callbackId) === 0;
    this.shortcuts.set(callbackId, { modifiers, key: normalizedKey, callback });
    this.startListening();
    return nativeRegistered;
  }

  unregister(callbackId: string): boolean {
    const removed = this.shortcuts.delete(callbackId);
    const nativeRemoved = this.native?.shortcutUnregister(callbackId) === 0;
    if (this.shortcuts.size === 0) this.stopListening();
    return removed || nativeRemoved;
  }

  unregisterAll(): void {
    this.shortcuts.clear();
    this.native?.shortcutUnregisterAll();
    this.stopListening();
  }

  private startListening(): void {
    if (this.listening || !this.target) return;
    this.target.addEventListener("keydown", this.onKeyDown);
    this.listening = true;
  }

  private stopListening(): void {
    if (!this.listening || !this.target) return;
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.listening = false;
  }

  private readonly onKeyDown = (event: ShortcutKeyEvent): void => {
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.key !== event.key.toLowerCase() || !this.matchesModifiers(shortcut.modifiers, event)) continue;
      event.preventDefault();
      shortcut.callback();
      return;
    }
  };

  private matchesModifiers(modifiers: number, event: ShortcutKeyEvent): boolean {
    return Boolean(modifiers & ShortcutModifiers.Control) === event.ctrlKey
      && Boolean(modifiers & ShortcutModifiers.Shift) === event.shiftKey
      && Boolean(modifiers & ShortcutModifiers.Alt) === event.altKey
      && Boolean(modifiers & ShortcutModifiers.Meta) === event.metaKey;
  }
}

function encryptedValue(value: string, key: Buffer): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${nonce.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decryptedValue(value: string, key: Buffer): string | undefined {
  const [nonceText, tagText, ciphertextText] = value.split(".");
  if (!nonceText || !tagText || !ciphertextText) return undefined;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(nonceText, "base64url"));
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return undefined;
  }
}

/** Uses the native store when present and an encrypted in-memory store otherwise. */
export class NativeCache {
  private readonly native: NativeLibrary | undefined;
  private readonly fallback = new Map<string, string>();
  private readonly key: Buffer;

  constructor(options: { path?: string; masterKey?: string; native?: NativeLibrary } = {}) {
    const candidate = options.native ?? loadNativeLib();
    const masterKey = options.masterKey ?? process.env.CREATURE_CACHE_MASTER_KEY ?? "creature-local-fallback";
    this.key = createHash("sha256").update(masterKey).digest();
    this.native = candidate && candidate.cacheInit(options.path ?? resolve(process.cwd(), ".creature-cache"), masterKey) === 0 ? candidate : undefined;
  }

  set(key: string, value: string): void {
    const encrypted = encryptedValue(value, this.key);
    this.fallback.set(key, encrypted);
    if (this.native && this.native.cacheSet(key, value) !== 0) throw new Error("Unable to write native cache");
  }

  get(key: string): string | undefined {
    if (this.native) {
      const pointer = Buffer.alloc(koffi.sizeof("void *"));
      const length = Buffer.alloc(8);
      if (this.native.cacheGet(key, pointer, length) === 0) {
        const byteLength = Number(length.readBigUInt64LE());
        if (byteLength === 0) return undefined;
        const resultPointer = koffi.decode(pointer, "void *");
        try {
          const bytes = koffi.decode(resultPointer, koffi.array("uint8_t", byteLength)) as Uint8Array;
          return Buffer.from(bytes).toString("utf8");
        } finally {
          this.native.cacheFreeString(resultPointer, byteLength);
        }
      }
    }
    const encrypted = this.fallback.get(key);
    return encrypted ? decryptedValue(encrypted, this.key) : undefined;
  }

  delete(key: string): void {
    this.fallback.delete(key);
    if (this.native && this.native.cacheDelete(key) !== 0) throw new Error("Unable to delete native cache entry");
  }

  /** Intended only for assertions that fallback values are not stored as plaintext. */
  storageSnapshot(): ReadonlyMap<string, string> {
    return new Map(this.fallback);
  }
}

export type NativeQueueOperation = {
  id: string;
  type: string;
  payload: string;
  retry_count: number;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: number;
  error?: string;
};

/** In-memory implementation mirrors the native queue contract when the DLL is absent. */
export class NativeQueue {
  private readonly operations: NativeQueueOperation[] = [];

  enqueue(type: string, payload: string): NativeQueueOperation {
    const operation: NativeQueueOperation = {
      id: `op-${Date.now()}-${randomBytes(8).toString("hex")}`,
      type,
      payload,
      retry_count: 0,
      status: "pending",
      created_at: Date.now(),
    };
    this.operations.push(operation);
    return { ...operation };
  }

  dequeue(): NativeQueueOperation | undefined {
    const operation = this.operations.find((item) => item.status === "pending");
    if (!operation) return undefined;
    operation.status = "processing";
    return { ...operation };
  }

  markCompleted(id: string): void {
    const operation = this.find(id);
    operation.status = "completed";
    delete operation.error;
  }

  markFailed(id: string, error: string): void {
    const operation = this.find(id);
    operation.status = "failed";
    operation.retry_count += 1;
    operation.error = error;
  }

  retry(id: string): void {
    const operation = this.find(id);
    operation.status = "pending";
    delete operation.error;
  }

  pending(): NativeQueueOperation[] {
    return this.operations.filter((operation) => operation.status === "pending").map((operation) => ({ ...operation }));
  }

  pendingCount(): number {
    return this.pending().length;
  }

  private find(id: string): NativeQueueOperation {
    const operation = this.operations.find((item) => item.id === id);
    if (!operation) throw new Error(`Offline operation ${id} was not found`);
    return operation;
  }
}
