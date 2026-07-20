import type { DurableRun, DurableSessionRuntime } from "../../agent/runtime.js";
import { TaskInboxItem } from "./TaskInboxItem.js";
import { getInboxGroups, useInbox, type InboxCategory, type InboxGroups } from "../hooks/useInbox.js";

export interface TaskInboxProps {
  readonly runtime?: DurableSessionRuntime;
  readonly runs?: readonly DurableRun[];
  readonly onSelectRun?: (runId: string) => void;
  readonly onOpenChat?: (threadId: string) => void;
  readonly onDismiss?: (runId: string) => void;
  readonly canApprove?: (runId: string) => boolean;
  readonly onAuditAction?: (action: "approve" | "retry" | "dismiss", runId: string) => void;
}

const sections: ReadonlyArray<{ readonly category: InboxCategory; readonly label: string; readonly empty: string }> = [
  { category: "input", label: "Requires input", empty: "No tasks require your input." },
  { category: "approval", label: "Approval requests", empty: "No approval requests." },
  { category: "failure", label: "Failures", empty: "No failed or cancelled tasks." },
  { category: "completed", label: "Completed work", empty: "No completed work yet." },
];

function InboxContent({ groups, runtime, onSelectRun, onOpenChat, onDismiss, canApprove, onAuditAction }: TaskInboxProps & { readonly groups: InboxGroups }) {
  const approve = (runId: string) => { onAuditAction?.("approve", runId); void runtime?.approve(runId); };
  const retry = (runId: string) => { onAuditAction?.("retry", runId); void runtime?.retry(runId); };
  const dismiss = (runId: string) => { onAuditAction?.("dismiss", runId); onDismiss?.(runId); };
  return <section aria-label="Task inbox">
    <h2>Task inbox</h2>
    {sections.map(({ category, label, empty }) => {
      const items = groups[category];
      return <section key={category} aria-label={label}>
        <h3>{label} ({items.length})</h3>
        {items.length === 0 ? <p>{empty}</p> : <ul>{items.map((item) =>
          <TaskInboxItem key={item.run.id} item={item} onSelectRun={onSelectRun} onApprove={approve} onRetry={retry} onDismiss={dismiss} onOpenChat={onOpenChat} canApprove={canApprove} />,
        )}</ul>}
      </section>;
    })}
  </section>;
}

function RuntimeInbox(props: TaskInboxProps & { readonly runtime: DurableSessionRuntime }) {
  return <InboxContent {...props} groups={useInbox(props.runtime)} />;
}

export function TaskInbox(props: TaskInboxProps) {
  if (props.runtime !== undefined) return <RuntimeInbox {...props} runtime={props.runtime} />;
  return <InboxContent {...props} groups={getInboxGroups(props.runs ?? [])} />;
}
