import koffi from "koffi";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export interface NativeLibrary {
  init(): number;
  trayShow(iconPath: string, tooltip: string): number;
  trayHide(): number;
  traySetTooltip(tooltip: string): number;
  notificationShow(title: string, body: string): number;
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
    const native = {
      init: library.func("int creature_native_init(void)"),
      trayShow: library.func("int creature_tray_show(const char *icon_path, const char *tooltip)"),
      trayHide: library.func("int creature_tray_hide(void)"),
      traySetTooltip: library.func("int creature_tray_set_tooltip(const char *tooltip)"),
      notificationShow: library.func("int creature_notification_show(const char *title, const char *body)"),
    } as NativeLibrary;
    if (native.init() !== 0) return undefined;
    return native;
  } catch {
    return undefined;
  }
}

export class NativeTray {
  private readonly native = loadNativeLib();

  show(iconPath: string, tooltip: string): void {
    if (this.native && this.native.trayShow(iconPath, tooltip) !== 0) {
      throw new Error("Unable to show tray");
    }
  }

  hide(): void {
    if (this.native && this.native.trayHide() !== 0) throw new Error("Unable to hide tray");
  }

  setTooltip(tooltip: string): void {
    if (this.native && this.native.traySetTooltip(tooltip) !== 0) {
      throw new Error("Unable to set tray tooltip");
    }
  }
}

export class NativeNotifications {
  private readonly native = loadNativeLib();

  show(title: string, body: string): void {
    if (this.native && this.native.notificationShow(title, body) !== 0) {
      throw new Error("Unable to show notification");
    }
  }
}
