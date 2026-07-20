import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatRuntime } from "../../src/agent/chat/runtime.js";
import { InMemoryChatStore } from "../../src/agent/chat/store.js";
import { DurableSessionRuntime, InMemoryRunStore } from "../../src/agent/runtime.js";
import { ChatPanel } from "../../src/ui/components/ChatPanel.js";

test("chat panel renders the composer, sources, branch action, and background action", async () => {
  const runtime = new ChatRuntime({
    store: new InMemoryChatStore(),
    durableRuntime: new DurableSessionRuntime(new InMemoryRunStore()),
  });
  const thread = runtime.createThread("Panel chat");
  await runtime.sendMessage(thread.id, "Review this", [{ id: "mail", kind: "gmail", title: "Gmail message", source: "gmail://mail", requiresApproval: true }]);
  const markup = renderToStaticMarkup(<ChatPanel runtime={runtime} threadId={thread.id} />);
  assert.match(markup, /Chat composer/);
  assert.match(markup, /Gmail message/);
  assert.match(markup, /Branch here/);
  assert.match(markup, /Approve action/);
  assert.match(markup, /Run in background/);
});
