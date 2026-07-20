import type { DurableRun } from "../runtime.js";

export interface AuditEvent {
  runId: string;
  status: DurableRun["status"];
  checkpointCount: number;
  occurredAt: string;
}

export const createAuditEvent = (run: DurableRun): AuditEvent => ({
  runId: run.id,
  status: run.status,
  checkpointCount: run.checkpoints.length,
  occurredAt: run.updatedAt,
});
