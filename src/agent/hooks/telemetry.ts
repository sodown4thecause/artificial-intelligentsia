import type { DurableRun } from "../runtime.js";

export interface RunTelemetry {
  runId: string;
  status: DurableRun["status"];
  partialOutputCount: number;
}

export const createRunTelemetry = (run: DurableRun): RunTelemetry => ({
  runId: run.id,
  status: run.status,
  partialOutputCount: run.partialOutputs.length,
});
