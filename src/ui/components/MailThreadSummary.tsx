import type { MailThreadSummary } from "../../mail/types.js";

export interface MailThreadSummaryProps {
  summary?: MailThreadSummary;
  onCreateDraft(threadId: string): void;
}

export function MailThreadSummary({ summary, onCreateDraft }: MailThreadSummaryProps): JSX.Element {
  if (summary === undefined) return <section aria-label="Mail thread summary">Select a thread to summarize.</section>;
  return <section aria-label="Mail thread summary"><h2>Thread summary</h2><p>{summary.summary}</p>
    <h3>Sources</h3><ul aria-label="Message sources">{summary.citations.map((citation) => <li key={citation.messageId}><span>{citation.label}</span> <code>{citation.messageId}</code></li>)}</ul>
    <button type="button" onClick={() => onCreateDraft(summary.threadId)}>Create draft</button>
  </section>;
}
