import { getDesktopContext } from "./context.js";
/** Hooks called by the platform adapter. They deliberately remain platform-neutral. */
export async function onAppReady() {
    await getDesktopContext().tray.show();
}
export async function onAppActivate() {
    await getDesktopContext().tray.show();
}
export async function onAppBeforeQuit() {
    await getDesktopContext().tray.destroy();
}
export async function onAppWindowAllClosed() {
    // Creature remains available from the system tray when its last window closes.
}
//# sourceMappingURL=lifecycle.js.map