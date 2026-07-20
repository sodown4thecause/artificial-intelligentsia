import type { DurableRun, RunStatus } from "../../agent/runtime.js";

export interface TaskInboxProps {
  readonly runs: readonly DurableRun[];
  readonly onSelectRun?: (runId: string) => void;
}

const groups: ReadonlyArray<{ readonly label: string; readonly statuses: readonly RunStatus[] }> = [
  { label: "Requires input", statuses: ["waiting", "paused"] },
  { label: "Approval requests", statuses: ["approval_required"] },
  { label: "Failures", statuses: ["failed", "cancelled"] },
  { label: "Completed work", statuses: ["completed"] },
];

export function TaskInbox({ runs, onSelectRun }: TaskInboxProps) {
  return (
    <section aria-label="Task inbox">
      <h2>Task inbox</h2>
      {groups.map((group) => {
        const groupRuns = runs.filter((run) => group.statuses.includes(run.status));
        return (
          <section key={group.label} aria-label={group.label}>
            <h3>{group.label} ({groupRuns.length})</h3>
            <ul>
              {groupRuns.map((run) => (
                <li key={run.id}>
                  <button type="button" onClick={() => onSelectRun?.(run.id)}>{run.task}</button>
                  <span> — {run.status}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </section>
  );
}
