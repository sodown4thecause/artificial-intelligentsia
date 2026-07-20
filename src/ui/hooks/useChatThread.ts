import { useEffect, useState } from "react";
import type { ChatRuntime } from "../../agent/chat/runtime.js";
import type { ChatThread } from "../../agent/chat/types.js";

export function useChatThread(runtime: ChatRuntime, threadId: string): ChatThread | undefined {
  const [thread, setThread] = useState<ChatThread | undefined>(() => runtime.getThread(threadId));

  useEffect(() => {
    setThread(runtime.getThread(threadId));
    return runtime.subscribe(threadId, setThread);
  }, [runtime, threadId]);

  return thread;
}
