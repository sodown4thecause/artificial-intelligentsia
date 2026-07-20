import { getDesktopContext } from "./context.js";

export const COLD_START_TARGET_MS = 2_000;
export const COLD_START_CI_THRESHOLD_MS = 5_000;

export type LifecycleTimingEvent = {
  name: "desktop-bootstrap";
  phase: "started" | "completed" | "failed";
  timestampMs: number;
  durationMs?: number;
};

type LifecycleTimingListener = (event: LifecycleTimingEvent) => void;

const lifecycleTimingListeners = new Set<LifecycleTimingListener>();

/** Subscribe to platform-neutral lifecycle timing marks. */
export function onLifecycleTiming(listener: LifecycleTimingListener): () => void {
  lifecycleTimingListeners.add(listener);
  return () => lifecycleTimingListeners.delete(listener);
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function emitLifecycleTiming(event: LifecycleTimingEvent): void {
  for (const listener of lifecycleTimingListeners) {
    try {
      listener(event);
    } catch {
      // Observability must not prevent a desktop process from becoming ready.
    }
  }
}

/**
 * Measures the work required for a desktop process to become available.
 * Kept injectable so platform adapters and the benchmark harness exercise the
 * exact same timing boundary.
 */
export async function measureDesktopBootstrap(
  bootstrap: () => Promise<void>,
): Promise<number> {
  const startedAt = now();
  emitLifecycleTiming({
    name: "desktop-bootstrap",
    phase: "started",
    timestampMs: startedAt,
  });

  try {
    await bootstrap();
  } catch (error) {
    const failedAt = now();
    emitLifecycleTiming({
      name: "desktop-bootstrap",
      phase: "failed",
      timestampMs: failedAt,
      durationMs: failedAt - startedAt,
    });
    throw error;
  }

  const completedAt = now();
  const durationMs = completedAt - startedAt;
  emitLifecycleTiming({
    name: "desktop-bootstrap",
    phase: "completed",
    timestampMs: completedAt,
    durationMs,
  });
  return durationMs;
}

/** Hooks called by the platform adapter. They deliberately remain platform-neutral. */
export async function onAppReady(): Promise<void> {
  await measureDesktopBootstrap(async () => {
    await getDesktopContext().tray.show();
  });
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
