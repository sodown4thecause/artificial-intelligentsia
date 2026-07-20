/** Privacy-safe, content-free telemetry contracts. */
export const TELEMETRY_SCHEMA_VERSION = "1.0";

export type TelemetryEventName =
  | "agent.run.latency"
  | "model.latency"
  | "tool.latency"
  | "connector.latency"
  | "approval.wait"
  | "agent.retry"
  | "suggestion.accepted"
  | "automation.completed"
  | "agent.undo"
  | "agent.correction"
  | "memory.retrieved"
  | "memory.corrected";

export type TelemetryValue = string | number | boolean | null;
export type TelemetryAttributes = Record<string, TelemetryValue | undefined>;

export interface TelemetryEvent<TName extends TelemetryEventName = TelemetryEventName> {
  name: TName;
  schemaVersion: typeof TELEMETRY_SCHEMA_VERSION;
  occurredAt: string;
  /** Opaque identifiers only; never place user content or credentials here. */
  runId?: string;
  workspaceId?: string;
  attributes: TelemetryAttributes;
}

export interface TelemetrySink {
  persist(event: TelemetryEvent): void | Promise<void>;
}

export interface LatencyEventInput {
  runId?: string;
  workspaceId?: string;
  durationMs: number;
  outcome: "success" | "error" | "cancelled";
}

export interface AgentRunLatencyInput extends LatencyEventInput {
  agentId: string;
  agentVersion: string;
}

export interface ModelLatencyInput extends LatencyEventInput {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ToolLatencyInput extends LatencyEventInput {
  toolName: string;
}

export interface ConnectorLatencyInput extends LatencyEventInput {
  connector: string;
  operation: string;
}

export interface ApprovalWaitInput {
  runId: string;
  workspaceId?: string;
  durationMs: number;
  decision: "approved" | "rejected" | "expired" | "cancelled";
  actionClass: "reversible" | "consequential" | "destructive";
}

export interface RetryInput {
  runId: string;
  workspaceId?: string;
  attempt: number;
  operation: "agent" | "model" | "tool" | "connector";
  recovered: boolean;
}

export interface SuggestionAcceptanceInput {
  workspaceId?: string;
  suggestionCategory: string;
  accepted: boolean;
}

export interface AutomationCompletionInput {
  runId?: string;
  workspaceId?: string;
  automationId: string;
  mode: "simulation" | "dry-run" | "approval-required" | "active";
  outcome: "success" | "failure" | "cancelled";
  durationMs: number;
}

export interface ChangeFeedbackInput {
  runId?: string;
  workspaceId?: string;
  surface: "writing" | "mail" | "docs" | "automation";
}

export interface MemoryRetrievalInput {
  runId?: string;
  workspaceId?: string;
  resultCount: number;
  scope: "personal" | "workspace" | "project";
}

export interface MemoryCorrectionInput {
  workspaceId?: string;
  action: "corrected" | "deleted" | "scope-changed" | "pinned";
  scope: "personal" | "workspace" | "project";
}
