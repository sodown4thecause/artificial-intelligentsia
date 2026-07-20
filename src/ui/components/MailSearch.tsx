import { useState } from "react";
import type { GmailSearchQuery } from "../../connectors/gmail.js";
import type { MailSearchResult } from "../../mail/types.js";

export interface MailSearchProps {
  result?: MailSearchResult;
  selectedThreadId?: string;
  onSearch(query: GmailSearchQuery): void;
  onSelectThread(threadId: string): void;
}

export function MailSearch({ result, selectedThreadId, onSearch, onSelectThread }: MailSearchProps): JSX.Element {
  const [text, setText] = useState("");
  const [from, setFrom] = useState("");
  const [label, setLabel] = useState("");
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");
  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSearch({
      ...(text === "" ? {} : { text }), ...(from === "" ? {} : { from }), ...(label === "" ? {} : { label }),
      ...(after === "" ? {} : { after: new Date(after) }), ...(before === "" ? {} : { before: new Date(before) }),
    });
  };
  return <section aria-label="Gmail search"><form onSubmit={submit}>
    <label>Search<input aria-label="Search email" value={text} onChange={(event) => setText(event.target.value)} /></label>
    <label>From<input aria-label="From" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
    <label>Label<input aria-label="Label" value={label} onChange={(event) => setLabel(event.target.value)} /></label>
    <label>After<input aria-label="After" type="date" value={after} onChange={(event) => setAfter(event.target.value)} /></label>
    <label>Before<input aria-label="Before" type="date" value={before} onChange={(event) => setBefore(event.target.value)} /></label>
    <button type="submit">Search Gmail</button>
  </form><ol aria-label="Mail threads">{result?.threads.map((thread) => <li key={thread.id}>
    <button type="button" aria-pressed={selectedThreadId === thread.id} onClick={() => onSelectThread(thread.id)}>{thread.subject}</button>
    <span>{thread.messages.length} messages</span>
  </li>)}</ol></section>;
}
