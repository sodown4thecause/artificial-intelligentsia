import { LocalCache } from "../native/cache.js";
import { ApprovalGate } from "../approvals/gate.js";
import { automationActionApprovalPolicy } from "../approvals/policy.js";
import type { ApprovalPolicy } from "../approvals/types.js";

export type RunStatus =
  | "queued"
  | "running"
  | "waiting"
  | "approval_required"
  | "paused"
  | "failed"
  | "cancelled"
  | "completed";

export interface StepCheckpoint {
  stepId: string;
  completedAt: string;
  output?: unknown;
}

export interface PartialOutput {
  stepId: string;
  value: unknown;
  createdAt: string;
}

export interface DurableRun {
  id: string;
  task: string;
  status: RunStatus;
  nextStepIndex: number;
  checkpoints: StepCheckpoint[];
  partialOutputs: PartialOutput[];
  approvedStepIds: string[];
  pendingApprovalStepId?: string;
  pendingApprovalRequestId?: string;
  approvalRequestIds?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
  threadId?: string;
}

export interface StepResult {
  output?: unknown;
  waitForInput?: boolean;
}

export interface AgentStep {
  id: string;
  requiresApproval?: boolean;
  approval?: {
    readonly actionType?: string;
    readonly target?: string;
    readonly payload?: unknown;
    readonly payloadSummary?: string;
    readonly policy?: ApprovalPolicy;
    readonly requestedBy?: string;
  };
  execute(context: StepContext): Promise<StepResult | void> | StepResult | void;
}

export interface StepContext {
  run: Readonly<DurableRun>;
  emitPartialOutput(value: unknown): void;
}

export interface RunStore {
  load(id: string): DurableRun | undefined;
  save(run: DurableRun): void;
  listRuns(): Promise<readonly DurableRun[]> | readonly DurableRun[];
}

/** A process-local store for tests and environments without a native cache. */
export class InMemoryRunStore implements RunStore {
  private readonly runs = new Map<string, DurableRun>();

  load(id: string): DurableRun | undefined {
    const run = this.runs.get(id);
    return run === undefined ? undefined : structuredClone(run);
  }

  save(run: DurableRun): void {
    this.runs.set(run.id, structuredClone(run));
  }

  listRuns(): readonly DurableRun[] {
    return [...this.runs.values()].map((run) => structuredClone(run));
  }

  clear(): void {
    this.runs.clear();
  }
}

/** Persists durable run metadata through the native cache abstraction. */
export class NativeCacheRunStore implements RunStore {
  private static readonly indexId = "__durable-run-index__";

  constructor(private readonly cache: LocalCache = new LocalCache()) {}

  load(id: string): DurableRun | undefined {
    return this.cache.getAgentRun<DurableRun>(id);
  }

  save(run: DurableRun): void {
    this.cache.setAgentRun(run.id, run);
    const ids = this.loadIndexedRunIds();
    if (!ids.includes(run.id)) {
      this.cache.setAgentRun(NativeCacheRunStore.indexId, {
        id: NativeCacheRunStore.indexId,
        task: "Durable run index",
        status: "completed",
        nextStepIndex: 0,
        checkpoints: [],
        partialOutputs: ids.concat(run.id).map((id) => ({ stepId: id, value: id, createdAt: run.updatedAt })),
        approvedStepIds: [],
        approvalRequestIds: [],
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      });
    }
  }

  listRuns(): readonly DurableRun[] {
    return this.loadIndexedRunIds()
      .map((id) => this.cache.getAgentRun<DurableRun>(id))
      .filter((run): run is DurableRun => run !== undefined);
  }

  private loadIndexedRunIds(): readonly string[] {
    return this.cache.getAgentRun<DurableRun>(NativeCacheRunStore.indexId)?.partialOutputs
      .map((output) => typeof output.value === "string" ? output.value : undefined)
      .filter((id): id is string => id !== undefined) ?? [];
  }
}

const now = (): string => new Date().toISOString();

export class DurableSessionRuntime {
  private readonly definitions = new Map<string, readonly AgentStep[]>();
  private readonly listeners = new Map<string, Set<(run: DurableRun) => void>>();

  constructor(
    private readonly store: RunStore = new NativeCacheRunStore(),
    private readonly approvalGate: ApprovalGate = new ApprovalGate(),
  ) {}

  createRun(id: string, task: string, steps: readonly AgentStep[], threadId?: string): DurableRun {
    if (steps.length === 0) {
      throw new Error("A durable run requires at least one step.");
    }
    if (this.store.load(id) !== undefined) {
      throw new Error(`A durable run already exists for ${id}.`);
    }

    const timestamp = now();
    const run: DurableRun = {
      id,
      task,
      status: "queued",
      nextStepIndex: 0,
      checkpoints: [],
      partialOutputs: [],
      approvedStepIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      threadId,
    };
    this.definitions.set(id, steps);
    this.persist(run);
    return run;
  }

  registerSteps(id: string, steps: readonly AgentStep[]): void {
    if (this.store.load(id) === undefined) {
      throw new Error(`Unknown durable run ${id}.`);
    }
    this.definitions.set(id, steps);
  }

  getRun(id: string): DurableRun | undefined {
    return this.store.load(id);
  }

  listRuns(): Promise<readonly DurableRun[]> | readonly DurableRun[] {
    return this.store.listRuns();
  }

  subscribe(id: string, listener: (run: DurableRun) => void): () => void {
    let listeners = this.listeners.get(id);
    if (listeners === undefined) {
      listeners = new Set();
      this.listeners.set(id, listeners);
    }
    listeners.add(listener);

    const run = this.store.load(id);
    if (run !== undefined) {
      listener(run);
    }

    return () => {
      const currentListeners = this.listeners.get(id);
      currentListeners?.delete(listener);
      if (currentListeners?.size === 0) {
        this.listeners.delete(id);
      }
    };
  }

  async start(id: string): Promise<DurableRun> {
    const run = this.requireRun(id);
    if (run.status !== "queued") {
      throw new Error(`Cannot start a run in ${run.status}.`);
    }
    return this.execute({ ...run, status: "running", error: undefined });
  }

  pause(id: string): DurableRun {
    const run = this.requireRun(id);
    if (!["running", "waiting", "approval_required"].includes(run.status)) {
      throw new Error(`Cannot pause a run in ${run.status}.`);
    }
    return this.persist({ ...run, status: "paused", pendingApprovalStepId: undefined });
  }

  async resume(id: string): Promise<DurableRun> {
    const run = this.requireRun(id);
    if (!["paused", "waiting"].includes(run.status)) {
      throw new Error(`Cannot resume a run in ${run.status}.`);
    }
    return this.execute({ ...run, status: "running" });
  }

  cancel(id: string): DurableRun {
    const run = this.requireRun(id);
    if (["completed", "cancelled"].includes(run.status)) {
      throw new Error(`Cannot cancel a run in ${run.status}.`);
    }
    return this.persist({ ...run, status: "cancelled", pendingApprovalStepId: undefined });
  }

  async retry(id: string): Promise<DurableRun> {
    const run = this.requireRun(id);
    if (run.status !== "failed") {
      throw new Error(`Cannot retry a run in ${run.status}.`);
    }
    return this.execute({ ...run, status: "running", error: undefined });
  }

  async approve(id: string, actor = "user", reason?: string): Promise<DurableRun> {
    const run = this.requireRun(id);
    const stepId = run.pendingApprovalStepId;
    const requestId = run.pendingApprovalRequestId;
    if (run.status !== "approval_required" || stepId === undefined || requestId === undefined) {
      throw new Error(`Run ${id} has no pending approval.`);
    }
    this.approvalGate.approve(requestId, actor, reason);
    return this.execute({
      ...run,
      status: "running",
      pendingApprovalStepId: undefined,
      pendingApprovalRequestId: undefined,
    });
  }

  deny(id: string, actor = "user", reason = "Approval denied."): DurableRun {
    const run = this.requireRun(id);
    if (run.status !== "approval_required" || run.pendingApprovalRequestId === undefined) {
      throw new Error(`Run ${id} has no pending approval.`);
    }
    this.approvalGate.deny(run.pendingApprovalRequestId, actor, reason);
    return this.persist({ ...run, status: "failed", error: reason, pendingApprovalStepId: undefined, pendingApprovalRequestId: undefined });
  }

  revoke(id: string, actor = "user", reason = "Approval revoked."): DurableRun {
    const run = this.requireRun(id);
    if (run.pendingApprovalRequestId === undefined) throw new Error(`Run ${id} has no pending approval.`);
    this.approvalGate.revoke(run.pendingApprovalRequestId, actor, reason);
    return this.persist({ ...run, status: "cancelled", error: reason, pendingApprovalStepId: undefined, pendingApprovalRequestId: undefined });
  }

  getApprovalRequest(id: string) {
    return this.approvalGate.get(id);
  }

  getApprovalAuditEvents() {
    return this.approvalGate.getAuditEvents();
  }

  private async execute(initialRun: DurableRun): Promise<DurableRun> {
    let run = this.persist(initialRun);
    const steps = this.definitions.get(run.id);
    if (steps === undefined) {
      return this.persist({ ...run, status: "failed", error: "Run definition is unavailable." });
    }

    while (run.nextStepIndex < steps.length) {
      const step = steps[run.nextStepIndex];
      if (step === undefined) {
        return this.persist({ ...run, status: "failed", error: "Run step is unavailable." });
      }
      if (step.requiresApproval) {
        const payload = this.approvalPayload(run, step);
        const requestId = (run.approvalRequestIds ?? []).find((candidate) => this.approvalGate.get(candidate)?.stepId === step.id);
        if (run.approvedStepIds.includes(step.id) && requestId === undefined) {
          // Preserves already-persisted approvals created before the unified gate existed.
        } else if (requestId === undefined) {
          const approval = step.approval;
          const request = this.approvalGate.create({
            runId: run.id,
            stepId: step.id,
            actionType: approval?.actionType ?? "automation action",
            target: approval?.target ?? step.id,
            payload,
            payloadSummary: approval?.payloadSummary ?? `Execute ${step.id} for ${run.task}.`,
            policy: approval?.policy ?? automationActionApprovalPolicy,
            requestedBy: approval?.requestedBy ?? "system",
          });
          return this.persist({
            ...run,
            status: "approval_required",
            pendingApprovalStepId: step.id,
            pendingApprovalRequestId: request.id,
            approvalRequestIds: [...(run.approvalRequestIds ?? []), request.id],
          });
        } else {
          const request = this.approvalGate.get(requestId);
          if (request?.status === "pending") {
            return this.persist({ ...run, status: "approval_required", pendingApprovalStepId: step.id, pendingApprovalRequestId: requestId });
          }
          if (request?.status === "denied" || request?.status === "revoked") {
            return this.persist({ ...run, status: "failed", error: request.reason ?? `Approval ${request.status}.` });
          }
          this.approvalGate.assertApproved(requestId, payload);
        }
      }

      try {
        const result = await step.execute({
          run,
          emitPartialOutput: (value) => {
            run = this.persist({
              ...run,
              partialOutputs: [...run.partialOutputs, { stepId: step.id, value, createdAt: now() }],
            });
          },
        });
        if (result?.waitForInput) {
          return this.persist({ ...run, status: "waiting" });
        }
        run = this.persist({
          ...run,
          nextStepIndex: run.nextStepIndex + 1,
          checkpoints: [...run.checkpoints, { stepId: step.id, completedAt: now(), output: result?.output }],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown step failure.";
        return this.persist({ ...run, status: "failed", error: message });
      }
    }

    return this.persist({ ...run, status: "completed" });
  }

  private requireRun(id: string): DurableRun {
    const run = this.store.load(id);
    if (run === undefined) {
      throw new Error(`Unknown durable run ${id}.`);
    }
    return run;
  }

  private persist(run: DurableRun): DurableRun {
    const saved = { ...run, updatedAt: now() };
    this.store.save(saved);
    for (const listener of this.listeners.get(saved.id) ?? []) {
      listener(structuredClone(saved));
    }
    return saved;
  }

  private approvalPayload(run: DurableRun, step: AgentStep): unknown {
    return step.approval?.payload ?? { runId: run.id, stepId: step.id, task: run.task };
  }
}
