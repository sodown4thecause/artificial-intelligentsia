import { getDesktopContext } from "./context.js";

/** Hooks called by the platform adapter. They deliberately remain platform-neutral. */
export async function onAppReady(): Promise<void> {
  await getDesktopContext().tray.show();
}

export async function onAppActivate(): Promise<void> {
  await getDesktopContext().tray.show();
}

export async function onAppBeforeQuit(): Promise<void> {
  await getDesktopContext().tray.destroy();
}

export async function onAppWindowAllClosed(): Promise<void> {
  // Creature remains available from the system tray when its last window closes.
}
