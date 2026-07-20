import { redactSecrets } from "../../security/redaction.js";
import type { InboxItem } from "../hooks/useInbox.js";

export interface TaskInboxItemProps {
  readonly item: InboxItem;
  readonly onSelectRun?: (runId: string) => void;
  readonly onApprove?: (runId: string) => void;
  readonly onRetry?: (runId: string) => void;
  readonly onDismiss?: (runId: string) => void;
  readonly onOpenChat?: (threadId: string) => void;
  readonly canApprove?: (runId: string) => boolean;
}

export function TaskInboxItem({ item, onSelectRun, onApprove, onRetry, onDismiss, onOpenChat, canApprove }: TaskInboxItemProps) {
  const { run, category } = item;
  const approveAllowed = canApprove?.(run.id) ?? true;
  return <li>
    <strong>{redactSecrets(run.task)}</strong><span> — {run.status}</span>
    <p>{redactSecrets(item.summary)}</p>
    <small>Updated {new Date(run.updatedAt).toLocaleString()}</small>
    <p><strong>Next action:</strong> {item.nextAction}</p>
    <button type="button" onClick={() => onSelectRun?.(run.id)}>Open</button>
    {category === "approval" && <button type="button" disabled={!approveAllowed} onClick={() => onApprove?.(run.id)}>Approve</button>}
    {category === "failure" && run.status === "failed" && <button type="button" onClick={() => onRetry?.(run.id)}>Retry</button>}
    {category === "failure" && <button type="button" onClick={() => onDismiss?.(run.id)}>Dismiss</button>}
    {run.threadId !== undefined && <button type="button" onClick={() => onOpenChat?.(run.threadId ?? "")}>Open chat</button>}
  </li>;
}
