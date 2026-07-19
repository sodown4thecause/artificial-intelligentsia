import type { DesktopContext } from "../desktop/context.js";
import { NativeStatusBar } from "./components/NativeStatusBar.js";

interface DesktopAppProps {
  readonly desktop: DesktopContext;
  readonly pendingApprovals?: number;
}

export function DesktopApp({ desktop, pendingApprovals = 0 }: DesktopAppProps) {
  return (
    <main className="desktop-app">
      <header>
        <h1>Creature OS</h1>
        <button type="button" aria-label="Open command palette">Command palette</button>
      </header>
      <section aria-label="Workspace">
        <p>Connection: {desktop.nativeLoaded ? "Native connected" : "Offline fallback"}</p>
        <p>Pending approvals: {pendingApprovals}</p>
      </section>
      <NativeStatusBar desktop={desktop} />
    </main>
  );
}
