import { useEffect, useState } from "react";
import type { DurableRun, DurableSessionRuntime } from "../../agent/runtime.js";

/** Keeps a UI surface synchronized with a durable runtime run. */
export function useDurableRun(
  runtime: DurableSessionRuntime | undefined,
  runId: string | undefined,
): DurableRun | undefined {
  const [run, setRun] = useState<DurableRun | undefined>(() =>
    runtime !== undefined && runId !== undefined ? runtime.getRun(runId) : undefined,
  );

  useEffect(() => {
    if (runtime === undefined || runId === undefined) {
      setRun(undefined);
      return undefined;
    }

    setRun(runtime.getRun(runId));
    return runtime.subscribe(runId, setRun);
  }, [runtime, runId]);

  return run;
}
