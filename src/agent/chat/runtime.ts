import {
  DurableSessionRuntime,
  type AgentStep,
  type DurableRun,
} from "../runtime.js";
import { redactSecrets } from "../../core/redaction/secrets.js";
import { InMemoryChatStore, NativeCacheChatStore, type ChatStore } from "./store.js";
import type { ChatAttachment, ChatMessage, ChatThread } from "./types.js";

export interface ChatAuditRecord {
  action: "chat.user_message" | "chat.assistant_completed" | "chat.tool_call" | "chat.approval";
  threadId: string;
  messageId?: string;
  runId?: string;
  createdAt: string;
}

export interface ChatRuntimeOptions {
  store?: ChatStore;
  durableRuntime?: DurableSessionRuntime;
  audit?: (record: ChatAuditRecord) => void;
  authorizeAttachment?: (attachment: ChatAttachment) => boolean;
  extractMemoryCandidate?: (message: ChatMessage, thread: ChatThread) => void;
  respond?: (message: ChatMessage, thread: ChatThread) => string | Promise<string>;
}

const timestamp = (): string => new Date().toISOString();
const randomId = (prefix: string): string => `${prefix}_${crypto.randomUUID()}`;
const redact = (content: string): string => redactSecrets(content);

export class ChatRuntime {
  private readonly store: ChatStore;
  private readonly durableRuntime: DurableSessionRuntime;
  private readonly listeners = new Map<string, Set<(thread: ChatThread) => void>>();
  private readonly audit: (record: ChatAuditRecord) => void;
  private readonly authorizeAttachment: (attachment: ChatAttachment) => boolean;
  private readonly extractMemoryCandidate: (message: ChatMessage, thread: ChatThread) => void;
  private readonly respond: (message: ChatMessage, thread: ChatThread) => string | Promise<string>;

  constructor(options: ChatRuntimeOptions = {}) {
    this.store = options.store ?? new NativeCacheChatStore();
    this.durableRuntime = options.durableRuntime ?? new DurableSessionRuntime();
    this.audit = options.audit ?? (() => undefined);
    this.authorizeAttachment = options.authorizeAttachment ?? (() => true);
    this.extractMemoryCandidate = options.extractMemoryCandidate ?? (() => undefined);
    this.respond = options.respond ?? ((message) => `I received: ${message.content}`);
  }

  createThread(title = "New chat", id = randomId("chat")): ChatThread {
    const existing = this.store.load(id);
    if (existing !== undefined) {
      throw new Error(`A chat thread already exists for ${id}.`);
    }
    const createdAt = timestamp();
    return this.persist({ id, title, messages: [], runIds: [], createdAt, updatedAt: createdAt });
  }

  getThread(id: string): ChatThread | undefined {
    return this.store.load(id);
  }

  /** Loads persisted state and re-registers any durable definitions needed after a UI restart. */
  async loadThread(id: string): Promise<ChatThread> {
    const thread = this.requireThread(id);
    await this.resumeActiveRuns(thread.id);
    return this.requireThread(id);
  }

  listThreads(): ChatThread[] {
    return this.store.list();
  }

  getRun(id: string): DurableRun | undefined {
    return this.durableRuntime.getRun(id);
  }

  subscribe(id: string, listener: (thread: ChatThread) => void): () => void {
    const listeners = this.listeners.get(id) ?? new Set<(thread: ChatThread) => void>();
    listeners.add(listener);
    this.listeners.set(id, listeners);
    const thread = this.store.load(id);
    if (thread !== undefined) listener(thread);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.listeners.delete(id);
    };
  }

  async sendMessage(threadId: string, content: string, attachments: ChatAttachment[] = []): Promise<ChatThread> {
    if (content.trim().length === 0) throw new Error("A chat message cannot be empty.");
    for (const attachment of attachments) {
      if (!this.authorizeAttachment(attachment)) {
        throw new Error(`Permission denied for attachment ${attachment.id}.`);
      }
    }
    const thread = this.requireThread(threadId);
    const createdAt = timestamp();
    const message: ChatMessage = {
      id: randomId("message"), role: "user", content: redact(content), status: "complete",
      attachments: attachments.map((attachment) => ({ ...attachment, content: attachment.content === undefined ? undefined : redact(attachment.content) })),
      createdAt, updatedAt: createdAt,
    };
    let updated = this.persist({ ...thread, messages: [...thread.messages, message] });
    this.audit({ action: "chat.user_message", threadId, messageId: message.id, createdAt });
    this.extractMemoryCandidate(message, updated);
    for (const attachment of message.attachments) {
      this.audit({ action: "chat.tool_call", threadId, messageId: message.id, createdAt: timestamp() });
      void attachment;
    }

    const assistantCreatedAt = timestamp();
    const assistant: ChatMessage = {
      id: randomId("message"), role: "assistant", content: "", status: "streaming", attachments: [],
      createdAt: assistantCreatedAt, updatedAt: assistantCreatedAt,
    };
    const runId = randomId("chat-run");
    const step = this.assistantStep(threadId, message, assistant.id);
    this.durableRuntime.createRun(runId, message.content, [step]);
    assistant.runId = runId;
    updated = this.persist({ ...updated, messages: [...updated.messages, assistant], runIds: [...updated.runIds, runId] });
    this.bindRun(threadId, assistant.id, runId);
    await this.durableRuntime.start(runId);
    return this.requireThread(threadId);
  }

  branch(threadId: string, messageId: string, title?: string): ChatThread {
    const parent = this.requireThread(threadId);
    const index = parent.messages.findIndex((message) => message.id === messageId);
    if (index < 0) throw new Error(`Unknown message ${messageId}.`);
    const createdAt = timestamp();
    const branch: ChatThread = {
      id: randomId("chat"), title: title ?? `${parent.title} (branch)`,
      messages: structuredClone(parent.messages.slice(0, index + 1)), runIds: [], parentThreadId: parent.id,
      branchMessageId: messageId, createdAt, updatedAt: createdAt,
    };
    const saved = this.persist(branch);
    this.promoteToBackgroundTask(saved.id);
    return this.requireThread(saved.id);
  }

  promoteToBackgroundTask(threadId: string): DurableRun {
    const thread = this.requireThread(threadId);
    if (thread.backgroundRunId !== undefined) return this.requireRun(thread.backgroundRunId);
    const runId = randomId("background-run");
    const steps: AgentStep[] = [{ id: "background-work", execute: () => ({ waitForInput: true }) }];
    const run = this.durableRuntime.createRun(runId, `Background task: ${thread.title}`, steps);
    this.persist({ ...thread, backgroundRunId: runId, runIds: [...thread.runIds, runId] });
    void this.durableRuntime.start(runId);
    return run;
  }

  async approve(runId: string): Promise<DurableRun> {
    const run = await this.durableRuntime.approve(runId);
    const thread = this.threadForRun(runId);
    if (thread !== undefined) this.audit({ action: "chat.approval", threadId: thread.id, runId, createdAt: timestamp() });
    return run;
  }

  async resumeActiveRuns(threadId: string): Promise<void> {
    const thread = this.requireThread(threadId);
    for (const runId of thread.runIds) {
      const run = this.durableRuntime.getRun(runId);
      if (run === undefined) continue;
      this.registerPersistedRun(thread, runId);
      if (run.status === "queued") await this.durableRuntime.start(runId);
      if (["waiting", "paused"].includes(run.status)) await this.durableRuntime.resume(runId);
    }
  }

  private assistantStep(threadId: string, userMessage: ChatMessage, assistantId: string): AgentStep {
    return {
      id: "assistant-response",
      requiresApproval: userMessage.attachments.some((attachment) => attachment.requiresApproval),
      execute: async (context) => {
        const thread = this.requireThread(threadId);
        const response = redact(await this.respond(userMessage, thread));
        for (const token of response.split(/(\s+)/).filter(Boolean)) context.emitPartialOutput(token);
        const message = this.findMessage(threadId, assistantId);
        if (message !== undefined) {
          this.extractMemoryCandidate({ ...message, content: response, status: "complete", updatedAt: timestamp() }, thread);
          this.audit({ action: "chat.assistant_completed", threadId, messageId: assistantId, runId: context.run.id, createdAt: timestamp() });
        }
        return { output: response };
      },
    };
  }

  private bindRun(threadId: string, messageId: string, runId: string): void {
    this.durableRuntime.subscribe(runId, (run) => {
      const thread = this.store.load(threadId);
      if (thread === undefined) return;
      const messageIndex = thread.messages.findIndex((message) => message.id === messageId);
      if (messageIndex < 0) return;
      const current = thread.messages[messageIndex];
      if (current === undefined) return;
      const content = run.partialOutputs.map((output) => String(output.value)).join("");
      const status = run.status === "completed" ? "complete" : run.status === "failed" ? "failed" : "streaming";
      const messages = [...thread.messages];
      messages[messageIndex] = { ...current, content: content || current.content, status, updatedAt: timestamp() };
      this.persist({ ...thread, messages });
    });
  }

  private registerPersistedRun(thread: ChatThread, runId: string): void {
    if (thread.backgroundRunId === runId) {
      this.durableRuntime.registerSteps(runId, [{ id: "background-work", execute: () => ({ waitForInput: true }) }]);
      return;
    }
    const assistant = thread.messages.find((message) => message.runId === runId);
    if (assistant === undefined) return;
    const index = thread.messages.findIndex((message) => message.id === assistant.id);
    const userMessage = thread.messages.slice(0, index).reverse().find((message) => message.role === "user");
    if (userMessage === undefined) return;
    this.durableRuntime.registerSteps(runId, [this.assistantStep(thread.id, userMessage, assistant.id)]);
    this.bindRun(thread.id, assistant.id, runId);
  }

  private findMessage(threadId: string, messageId: string): ChatMessage | undefined {
    return this.store.load(threadId)?.messages.find((message) => message.id === messageId);
  }

  private threadForRun(runId: string): ChatThread | undefined {
    return this.store.list().find((thread) => thread.runIds.includes(runId));
  }

  private requireRun(id: string): DurableRun {
    const run = this.durableRuntime.getRun(id);
    if (run === undefined) throw new Error(`Unknown durable run ${id}.`);
    return run;
  }

  private requireThread(id: string): ChatThread {
    const thread = this.store.load(id);
    if (thread === undefined) throw new Error(`Unknown chat thread ${id}.`);
    return thread;
  }

  private persist(thread: ChatThread): ChatThread {
    const saved = { ...thread, updatedAt: timestamp() };
    this.store.save(saved);
    for (const listener of this.listeners.get(saved.id) ?? []) listener(structuredClone(saved));
    return saved;
  }
}

export { InMemoryChatStore };
