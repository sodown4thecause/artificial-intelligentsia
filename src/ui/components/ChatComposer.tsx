import { useState, type FormEvent } from "react";
import type { ChatAttachment } from "../../agent/chat/types.js";

export interface ChatComposerProps {
  disabled?: boolean;
  onSend(content: string, attachments: ChatAttachment[]): Promise<void> | void;
}

const attachmentFromValue = (value: string): ChatAttachment | undefined => {
  if (value.length === 0) return undefined;
  const [kind = "connector", id = value, title = value, source = value] = value.split("|");
  if (kind !== "gmail" && kind !== "calendar" && kind !== "connector") return undefined;
  return { id, kind, title, source };
};

export function ChatComposer({ disabled = false, onSend }: ChatComposerProps): JSX.Element {
  const [content, setContent] = useState("");
  const [attachmentValue, setAttachmentValue] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (content.trim().length === 0 || disabled) return;
    await onSend(content, attachments);
    setContent("");
    setAttachments([]);
  };

  const addAttachment = (): void => {
    const attachment = attachmentFromValue(attachmentValue);
    if (attachment !== undefined && !attachments.some((item) => item.id === attachment.id)) {
      setAttachments([...attachments, attachment]);
    }
    setAttachmentValue("");
  };

  return (
    <form aria-label="Chat composer" onSubmit={submit}>
      <label>
        Message
        <textarea value={content} disabled={disabled} onChange={(event) => setContent(event.target.value)} />
      </label>
      <label>
        Attach source (kind|id|title|source)
        <input value={attachmentValue} disabled={disabled} onChange={(event) => setAttachmentValue(event.target.value)} />
      </label>
      <button type="button" disabled={disabled} onClick={addAttachment}>Attach context</button>
      <ul aria-label="Attached sources">
        {attachments.map((attachment) => <li key={attachment.id}>{attachment.title}</li>)}
      </ul>
      <button type="submit" disabled={disabled || content.trim().length === 0}>Send</button>
    </form>
  );
}
