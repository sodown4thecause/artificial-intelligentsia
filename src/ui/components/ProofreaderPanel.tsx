import { useMemo, useState } from "react";
import { groupProofreadingIssues } from "../../composition/proofreader.js";
import type { ProofreadingIssue } from "../../composition/types.js";

export interface ProofreaderPanelProps {
  readonly issues: readonly ProofreadingIssue[];
  readonly onAccept: (issue: ProofreadingIssue) => Promise<ProofreadingIssue> | ProofreadingIssue;
  readonly onReject: (issue: ProofreadingIssue) => Promise<ProofreadingIssue> | ProofreadingIssue;
  readonly onBatchAccept: (issues: readonly ProofreadingIssue[]) => Promise<readonly ProofreadingIssue[]> | readonly ProofreadingIssue[];
  readonly onBatchReject: (issues: readonly ProofreadingIssue[]) => Promise<readonly ProofreadingIssue[]> | readonly ProofreadingIssue[];
  readonly onApply: (issues: readonly ProofreadingIssue[]) => Promise<unknown> | unknown;
}

/** Shows grouped, individually reviewable proofreading edits before the user saves a version. */
export function ProofreaderPanel({ issues, onAccept, onReject, onBatchAccept, onBatchReject, onApply }: ProofreaderPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const groups = useMemo(() => groupProofreadingIssues(issues), [issues]);
  const run = async (action: () => Promise<unknown> | unknown, success: string) => { try { await action(); setMessage(success); } catch (error) { setMessage(error instanceof Error ? error.message : "Proofreading action failed."); } };
  return <section aria-label="Proofreader">
    <h2>Proofreader</h2>
    <div>
      <button type="button" onClick={() => { void run(() => onBatchAccept(issues.filter((issue) => issue.status === "pending")), "Issues accepted."); }}>Accept all</button>
      <button type="button" onClick={() => { void run(() => onBatchReject(issues.filter((issue) => issue.status === "pending")), "Issues rejected."); }}>Reject all</button>
      <button type="button" onClick={() => { void run(() => onApply(issues), "Accepted issues applied."); }}>Apply accepted issues</button>
    </div>
    {message !== null && <p role="status">{message}</p>}
    {[...groups.entries()].map(([group, groupIssues]) => <section key={group} aria-label={`${group} issues`}>
      <h3>{group.replace(":", " · ")}</h3>
      <ul>{groupIssues.map((issue) => <li key={issue.id}>
        <p><strong>{issue.originalText}</strong> → {issue.suggestedText}</p>
        <p>{issue.explanation}</p>
        <p>Status: {issue.status}</p>
        <button type="button" disabled={issue.status !== "pending"} onClick={() => { void run(() => onAccept(issue), "Issue accepted."); }}>Accept</button>
        <button type="button" disabled={issue.status !== "pending"} onClick={() => { void run(() => onReject(issue), "Issue rejected."); }}>Reject</button>
      </li>)}</ul>
    </section>)}
    {issues.length === 0 && <p>No issues found.</p>}
  </section>;
}
