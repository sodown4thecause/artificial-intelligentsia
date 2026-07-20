import { useState } from "react";
import type { DurableRun, DurableSessionRuntime } from "../agent/runtime.js";
import type { DesktopContext } from "../desktop/context.js";
import { NativeStatusBar } from "./components/NativeStatusBar.js";
import { RunTimeline } from "./components/RunTimeline.js";
import { TaskInbox } from "./components/TaskInbox.js";

interface DesktopAppProps {
  readonly desktop: DesktopContext;
  readonly pendingApprovals?: number;
  readonly runtime?: DurableSessionRuntime;
  readonly runs?: readonly DurableRun[];
}

export function DesktopApp({ desktop, pendingApprovals = 0, runtime, runs = [] }: DesktopAppProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>();
  return (
    <main className="desktop-app">
      <header>
        <h1>Creature OS</h1>
        <button type="button" aria-label="Open command palette">Command palette</button>
      </header>
      <section aria-label="Workspace">
        <p>Connection: {desktop.nativeLoaded ? "Native connected" : "Offline fallback"}</p>
        <p>Pending approvals: {pendingApprovals}</p>
        <TaskInbox runs={runs} onSelectRun={setSelectedRunId} />
        {runtime !== undefined && selectedRunId !== undefined && (
          <RunTimeline runtime={runtime} runId={selectedRunId} />
        )}
      </section>
      <NativeStatusBar desktop={desktop} />
    </main>
  );
}
