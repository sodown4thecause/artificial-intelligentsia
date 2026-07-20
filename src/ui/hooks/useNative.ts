import { getDesktopContext, type DesktopContext } from "../../desktop/context.js";

/** Returns the native desktop services made available during application bootstrap. */
export function useNative(): DesktopContext {
  return getDesktopContext();
}
