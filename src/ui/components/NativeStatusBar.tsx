import type { DesktopContext } from "../../desktop/context.js";

interface NativeStatusBarProps {
  readonly desktop: DesktopContext;
}

export function NativeStatusBar({ desktop }: NativeStatusBarProps) {
  const nativeStatus = desktop.nativeLoaded ? "Native layer connected" : "Fallback mode";
  const queueStatus = `${desktop.queue.pendingCount} offline operation${desktop.queue.pendingCount === 1 ? "" : "s"}`;

  return (
    <footer aria-label="Desktop status" className="native-status-bar">
      <span title={nativeStatus}>{nativeStatus}</span>
      <span>Sync ready</span>
      <span>{queueStatus}</span>
      <button aria-label="Notifications" type="button">🔔</button>
    </footer>
  );
}
