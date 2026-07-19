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
 * Registers keyboard shortcuts. In a real desktop app this wires to the native
 * layer; in browsers and tests it listens on the focused window.
 */
export class ShortcutService {
  private readonly target: ShortcutTarget | undefined;
  private readonly shortcuts = new Map<string, RegisteredShortcut>();
  private listening = false;

  constructor(target?: ShortcutTarget) {
    this.target = target ?? (typeof globalThis.addEventListener === "function" ? globalThis as unknown as ShortcutTarget : undefined);
  }

  register(modifiers: number, key: string, callbackId: string, callback: () => void): void {
    const normalizedKey = key.toLowerCase();
    this.shortcuts.set(callbackId, { modifiers, key: normalizedKey, callback });
    this.startListening();
  }

  unregister(callbackId: string): boolean {
    const removed = this.shortcuts.delete(callbackId);
    if (this.shortcuts.size === 0) this.stopListening();
    return removed;
  }

  unregisterAll(): void {
    this.shortcuts.clear();
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
