import {
  TELEMETRY_SCHEMA_VERSION,
  type AgentRunLatencyInput,
  type ApprovalWaitInput,
  type AutomationCompletionInput,
  type ChangeFeedbackInput,
  type ConnectorLatencyInput,
  type MemoryCorrectionInput,
  type MemoryRetrievalInput,
  type ModelLatencyInput,
  type RetryInput,
  type SuggestionAcceptanceInput,
  type TelemetryEvent,
  type TelemetryEventName,
  type TelemetrySink,
  type ToolLatencyInput,
} from "./types.js";

type Clock = () => Date;

function event<TName extends TelemetryEventName>(
  name: TName,
  input: { runId?: string; workspaceId?: string },
  attributes: TelemetryEvent["attributes"],
  now: Clock,
): TelemetryEvent<TName> {
  return { name, schemaVersion: TELEMETRY_SCHEMA_VERSION, occurredAt: now().toISOString(), runId: input.runId, workspaceId: input.workspaceId, attributes };
}

export interface TelemetryEmitter {
  agentRunLatency(input: AgentRunLatencyInput): void | Promise<void>;
  modelLatency(input: ModelLatencyInput): void | Promise<void>;
  toolLatency(input: ToolLatencyInput): void | Promise<void>;
  connectorLatency(input: ConnectorLatencyInput): void | Promise<void>;
  approvalWait(input: ApprovalWaitInput): void | Promise<void>;
  retry(input: RetryInput): void | Promise<void>;
  suggestionAcceptance(input: SuggestionAcceptanceInput): void | Promise<void>;
  automationCompletion(input: AutomationCompletionInput): void | Promise<void>;
  undo(input: ChangeFeedbackInput): void | Promise<void>;
  correction(input: ChangeFeedbackInput): void | Promise<void>;
  memoryRetrieval(input: MemoryRetrievalInput): void | Promise<void>;
  memoryCorrection(input: MemoryCorrectionInput): void | Promise<void>;
}

export function createTelemetryEmitter(sink: TelemetrySink, now: Clock = () => new Date()): TelemetryEmitter {
  const emit = (name: TelemetryEventName, input: { runId?: string; workspaceId?: string }, attributes: TelemetryEvent["attributes"]) => sink.persist(event(name, input, attributes, now));
  const latency = (name: TelemetryEventName, input: AgentRunLatencyInput | ModelLatencyInput | ToolLatencyInput | ConnectorLatencyInput, attributes: TelemetryEvent["attributes"]) => emit(name, input, { durationMs: input.durationMs, outcome: input.outcome, ...attributes });
  return {
    agentRunLatency: (input) => latency("agent.run.latency", input, { agentId: input.agentId, agentVersion: input.agentVersion }),
    modelLatency: (input) => latency("model.latency", input, { model: input.model, inputTokens: input.inputTokens, outputTokens: input.outputTokens }),
    toolLatency: (input) => latency("tool.latency", input, { toolName: input.toolName }),
    connectorLatency: (input) => latency("connector.latency", input, { connector: input.connector, operation: input.operation }),
    approvalWait: (input) => emit("approval.wait", input, { durationMs: input.durationMs, decision: input.decision, actionClass: input.actionClass }),
    retry: (input) => emit("agent.retry", input, { attempt: input.attempt, operation: input.operation, recovered: input.recovered }),
    suggestionAcceptance: (input) => emit("suggestion.accepted", input, { suggestionCategory: input.suggestionCategory, accepted: input.accepted }),
    automationCompletion: (input) => emit("automation.completed", input, { automationId: input.automationId, mode: input.mode, outcome: input.outcome, durationMs: input.durationMs }),
    undo: (input) => emit("agent.undo", input, { surface: input.surface }),
    correction: (input) => emit("agent.correction", input, { surface: input.surface }),
    memoryRetrieval: (input) => emit("memory.retrieved", input, { resultCount: input.resultCount, scope: input.scope }),
    memoryCorrection: (input) => emit("memory.corrected", input, { action: input.action, scope: input.scope }),
  };
}
