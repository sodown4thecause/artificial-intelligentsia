import assert from "node:assert/strict";
import test from "node:test";
import { ChatRuntime } from "../../src/agent/chat/runtime.js";
import { InMemoryChatStore } from "../../src/agent/chat/store.js";
import { DurableSessionRuntime, InMemoryRunStore } from "../../src/agent/runtime.js";

const createRuntime = (options: Partial<ConstructorParameters<typeof ChatRuntime>[0]> = {}): ChatRuntime => new ChatRuntime({
  store: new InMemoryChatStore(),
  durableRuntime: new DurableSessionRuntime(new InMemoryRunStore()),
  respond: (message) => `Echo: ${message.content}`,
  ...options,
});

test("chat threads persist ordered redacted messages and connector sources", async () => {
  const runtime = createRuntime();
  const thread = runtime.createThread("Inbox triage", "thread-1");
  await runtime.sendMessage(thread.id, "Use sk_live_abcdefghijklmnop", [{ id: "mail-1", kind: "gmail", title: "Receipt", source: "gmail://mail-1" }]);

  const loaded = runtime.getThread(thread.id);
  assert.equal(loaded?.messages.length, 2);
  assert.equal(loaded?.messages[0]?.role, "user");
  assert.equal(loaded?.messages[0]?.attachments[0]?.source, "gmail://mail-1");
  assert.equal(loaded?.messages[1]?.content.includes("Echo:"), true);
  assert.equal(loaded?.messages[1]?.status, "complete");
  assert.equal(loaded?.messages[0]?.content.includes("sk_live_abcdefghijklmnop"), false);
});

test("chat streaming writes partial durable output to its assistant message", async () => {
  const runtime = createRuntime({ respond: () => "one two" });
  const thread = runtime.createThread();
  await runtime.sendMessage(thread.id, "hello");
  const assistant = runtime.getThread(thread.id)?.messages[1];
  assert.equal(assistant?.content, "one two");
  assert.equal(runtime.getRun(assistant?.runId ?? "")?.partialOutputs.length, 3);
});

test("branches copy messages through the selected point and start a separate task", async () => {
  const runtime = createRuntime();
  const thread = runtime.createThread();
  await runtime.sendMessage(thread.id, "first");
  const message = runtime.getThread(thread.id)?.messages[0];
  assert.ok(message);
  const branch = runtime.branch(thread.id, message.id, "Alternative");
  assert.equal(branch.parentThreadId, thread.id);
  assert.equal(branch.messages.length, 1);
  assert.ok(branch.backgroundRunId);
  assert.notEqual(branch.id, thread.id);
});

test("a chat can be promoted and resumed as a durable background task", async () => {
  const store = new InMemoryChatStore();
  const runStore = new InMemoryRunStore();
  const first = new ChatRuntime({ store, durableRuntime: new DurableSessionRuntime(runStore) });
  const thread = first.createThread();
  const run = first.promoteToBackgroundTask(thread.id);
  await Promise.resolve();
  assert.equal(first.getRun(run.id)?.status, "waiting");

  const reopened = new ChatRuntime({ store, durableRuntime: new DurableSessionRuntime(runStore) });
  await reopened.resumeActiveRuns(thread.id);
  assert.equal(reopened.getThread(thread.id)?.backgroundRunId, run.id);
  assert.equal(reopened.getRun(run.id)?.status, "waiting");
});

test("connector context is permission checked and audit and memory hooks receive chat events", async () => {
  const records: string[] = [];
  const memory: string[] = [];
  const runtime = createRuntime({
    audit: (record) => records.push(record.action),
    extractMemoryCandidate: (message) => memory.push(message.id),
    authorizeAttachment: (attachment) => attachment.id !== "blocked",
  });
  const thread = runtime.createThread();
  await assert.rejects(() => runtime.sendMessage(thread.id, "nope", [{ id: "blocked", kind: "calendar", title: "Blocked", source: "calendar://blocked" }]));
  await runtime.sendMessage(thread.id, "allowed", [{ id: "event", kind: "calendar", title: "Standup", source: "calendar://event" }]);
  assert.deepEqual(records.slice(0, 3), ["chat.user_message", "chat.tool_call", "chat.assistant_completed"]);
  assert.ok(memory.length >= 2);
});

test("an approval-required attachment resumes its durable assistant response after approval", async () => {
  const runtime = createRuntime();
  const thread = runtime.createThread();
  await runtime.sendMessage(thread.id, "Summarize", [{ id: "sensitive", kind: "gmail", title: "Sensitive mail", source: "gmail://sensitive", requiresApproval: true }]);
  const assistant = runtime.getThread(thread.id)?.messages[1];
  assert.equal(runtime.getRun(assistant?.runId ?? "")?.status, "approval_required");
  await runtime.approve(assistant?.runId ?? "");
  assert.equal(runtime.getThread(thread.id)?.messages[1]?.status, "complete");
});
