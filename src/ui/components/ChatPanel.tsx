import { useState } from "react";
import type { ChatRuntime } from "../../agent/chat/runtime.js";
import type { ChatMessage } from "../../agent/chat/types.js";
import { useChatThread } from "../hooks/useChatThread.js";
import { ChatComposer } from "./ChatComposer.js";

export interface ChatPanelProps {
  runtime: ChatRuntime;
  threadId: string;
}

export function ChatPanel({ runtime, threadId }: ChatPanelProps): JSX.Element {
  const thread = useChatThread(runtime, threadId);
  const [error, setError] = useState<string | undefined>();

  if (thread === undefined) return <section aria-label="Chat panel">Chat not found.</section>;

  const send = async (content: string, attachments: Parameters<ChatRuntime["sendMessage"]>[2]): Promise<void> => {
    try {
      setError(undefined);
      await runtime.sendMessage(thread.id, content, attachments);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send message.");
    }
  };
  const branch = (message: ChatMessage): void => {
    try {
      runtime.branch(thread.id, message.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to branch chat.");
    }
  };
  const promote = (): void => {
    try {
      runtime.promoteToBackgroundTask(thread.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start background task.");
    }
  };

  return (
    <section aria-label="Chat panel">
      <header><h2>{thread.title}</h2><button type="button" onClick={promote}>Run in background</button></header>
      {error === undefined ? null : <p role="alert">{error}</p>}
      <ol aria-label="Chat messages">
        {thread.messages.map((message) => {
          const run = message.runId === undefined ? undefined : runtime.getRun(message.runId);
          return <li key={message.id} data-role={message.role}>
            <strong>{message.role}</strong>: {message.content}
            {message.status === "streaming" ? <span aria-label="Streaming response"> Streaming…</span> : null}
            {message.attachments.length === 0 ? null : <ul aria-label="Message sources">{message.attachments.map((attachment) => <li key={attachment.id}><a href={attachment.source}>{attachment.title}</a></li>)}</ul>}
            {run?.status === "approval_required" ? <button type="button" onClick={() => void runtime.approve(run.id)}>Approve action</button> : null}
            <button type="button" onClick={() => branch(message)}>Branch here</button>
          </li>;
        })}
      </ol>
      <ChatComposer onSend={send} />
    </section>
  );
}
