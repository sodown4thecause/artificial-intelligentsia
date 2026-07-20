import type { DurableRun, DurableSessionRuntime } from "../../agent/runtime.js";
import { ApprovalPreview } from "./ApprovalPreview.js";
import { useDurableRun } from "../hooks/useDurableRun.js";

export interface RunPlanStage {
  readonly id: string;
  readonly label: string;
}

export interface RunTimelineProps {
  readonly runtime: DurableSessionRuntime;
  readonly runId: string;
  readonly plan?: readonly RunPlanStage[];
  readonly sources?: readonly string[];
  readonly tools?: readonly string[];
}

function formatValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function stagesFor(run: DurableRun, plan: readonly RunPlanStage[]): readonly RunPlanStage[] {
  return plan.length > 0
    ? plan
    : run.checkpoints.map((checkpoint) => ({ id: checkpoint.stepId, label: checkpoint.stepId }));
}

export function RunTimeline({ runtime, runId, plan = [], sources = [], tools = [] }: RunTimelineProps) {
  const run = useDurableRun(runtime, runId);
  if (run === undefined) {
    return <section aria-label="Run timeline"><p>Run not found.</p></section>;
  }

  const stages = stagesFor(run, plan);
  const completedStepIds = new Set(run.checkpoints.map((checkpoint) => checkpoint.stepId));
  const invoke = (action: () => Promise<DurableRun> | DurableRun) => {
    void Promise.resolve(action()).catch(() => undefined);
  };

  return (
    <section aria-label={`Run timeline for ${run.task}`}>
      <header>
        <h2>{run.task}</h2>
        <p>Status: <strong>{run.status}</strong></p>
      </header>

      <section aria-label="Plan stages">
        <h3>Plan stages</h3>
        <ol>
          {stages.map((stage) => (
            <li key={stage.id}>{stage.label}: {completedStepIds.has(stage.id) ? "completed" : stage.id === run.pendingApprovalStepId ? "awaiting approval" : "pending"}</li>
          ))}
        </ol>
      </section>

      <section aria-label="Sources"><h3>Sources</h3><ul>{sources.map((source) => <li key={source}>{source}</li>)}</ul></section>
      <section aria-label="Tools"><h3>Tools</h3><ul>{tools.map((tool) => <li key={tool}>{tool}</li>)}</ul></section>

      {run.pendingApprovalStepId !== undefined && (
        <section aria-label="Pending approval">
          <h3>Pending approval</h3>
          <p>Step: {run.pendingApprovalStepId}</p>
          {run.pendingApprovalRequestId !== undefined && runtime.getApprovalRequest(run.pendingApprovalRequestId) !== undefined && (
            <ApprovalPreview request={runtime.getApprovalRequest(run.pendingApprovalRequestId)!} auditTrail={runtime.getApprovalAuditEvents().filter((event) => event.requestId === run.pendingApprovalRequestId)} />
          )}
          <button type="button" onClick={() => invoke(() => runtime.approve(run.id, "user"))}>Approve and resume</button>
          <button type="button" onClick={() => invoke(() => runtime.deny(run.id, "user", "Denied from timeline."))}>Deny</button>
          <button type="button" onClick={() => invoke(() => runtime.revoke(run.id, "user", "Revoked from timeline."))}>Revoke</button>
        </section>
      )}

      {run.error !== undefined && <section aria-label="Run error"><h3>Error</h3><p>{run.error}</p></section>}

      <section aria-label="Outputs">
        <h3>Outputs</h3>
        <ul>
          {run.checkpoints.map((checkpoint) => <li key={`checkpoint-${checkpoint.stepId}`}>{checkpoint.stepId}: {formatValue(checkpoint.output)}</li>)}
          {run.partialOutputs.map((output, index) => <li key={`partial-${output.stepId}-${index}`}>{output.stepId}: {formatValue(output.value)}</li>)}
        </ul>
      </section>

      <footer>
        <button type="button" disabled={run.status !== "failed"} onClick={() => invoke(() => runtime.retry(run.id))}>Retry</button>
        <button type="button" disabled={run.status === "completed" || run.status === "cancelled"} onClick={() => invoke(() => runtime.cancel(run.id))}>Cancel</button>
      </footer>
    </section>
  );
}
