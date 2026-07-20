import { useState } from "react";
import type { MailDraftInput } from "../../mail/types.js";
import { redactMailSecrets } from "../../mail/service.js";

export interface MailDraftComposerProps {
  threadId: string;
  initialTo?: readonly string[];
  initialSubject?: string;
  initialBody?: string;
  onSave(input: MailDraftInput): void;
}

export function MailDraftComposer({ threadId, initialTo = [], initialSubject = "", initialBody = "", onSave }: MailDraftComposerProps): JSX.Element {
  const [to, setTo] = useState(initialTo.join(", "));
  const [subject, setSubject] = useState(redactMailSecrets(initialSubject));
  const [body, setBody] = useState(redactMailSecrets(initialBody));
  const save = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSave({ threadId, to: to.split(",").map((value) => value.trim()).filter(Boolean), subject: redactMailSecrets(subject), body: redactMailSecrets(body), idempotencyKey: `${threadId}:${subject}:${body}` });
  };
  return <section aria-label="Mail draft composer"><p><strong>Unsent draft</strong> — this will not send email.</p><form onSubmit={save}>
    <label>To<input aria-label="To" value={to} onChange={(event) => setTo(event.target.value)} /></label>
    <label>Subject<input aria-label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
    <label>Body<textarea aria-label="Body" value={body} onChange={(event) => setBody(event.target.value)} /></label>
    <button type="submit">Save draft</button>
  </form></section>;
}
