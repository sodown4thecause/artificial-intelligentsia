import { NativeShortcuts, ShortcutModifiers } from "../native/bridge.js";

export const DesktopShortcutEvents = {
  goAgent: "creature:open-go-agent",
  mail: "creature:open-mail",
  docs: "creature:open-docs",
  write: "creature:open-write",
} as const;

function emitShortcutEvent(name: string): void {
  if (typeof globalThis.dispatchEvent !== "function") return;
  globalThis.dispatchEvent(new Event(name));
}

/** Registers desktop accelerators, with focused-window listeners as a fallback. */
export function registerGlobalShortcuts(shortcuts = new NativeShortcuts()): NativeShortcuts {
  const primaryModifier = process.platform === "darwin" ? ShortcutModifiers.Meta : ShortcutModifiers.Control;
  const modifiers = primaryModifier | ShortcutModifiers.Shift;
  const definitions: ReadonlyArray<readonly [string, string]> = [
    ["go-agent", DesktopShortcutEvents.goAgent],
    ["mail", DesktopShortcutEvents.mail],
    ["docs", DesktopShortcutEvents.docs],
    ["write", DesktopShortcutEvents.write],
  ];
  const keys = ["c", "m", "d", "w"] as const;

  definitions.forEach(([callbackId, eventName], index) => {
    shortcuts.register(modifiers, keys[index], callbackId, () => emitShortcutEvent(eventName));
  });
  return shortcuts;
}
