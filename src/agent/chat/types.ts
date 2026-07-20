import type { RunStatus } from "../runtime.js";

export type ChatRole = "user" | "assistant" | "system";
export type ChatMessageStatus = "pending" | "streaming" | "complete" | "failed";
export type ChatAttachmentKind = "gmail" | "calendar" | "connector";

/** A connector item deliberately attached by a user as chat context. */
export interface ChatAttachment {
  id: string;
  kind: ChatAttachmentKind;
  title: string;
  source: string;
  content?: string;
  requiresApproval?: boolean;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status: ChatMessageStatus;
  attachments: ChatAttachment[];
  runId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  runIds: string[];
  backgroundRunId?: string;
  parentThreadId?: string;
  branchMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRunState {
  id: string;
  status: RunStatus;
}
