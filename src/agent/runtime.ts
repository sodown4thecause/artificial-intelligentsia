import { LocalCache } from "../native/cache.js";

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
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StepResult {
  output?: unknown;
  waitForInput?: boolean;
}

export interface AgentStep {
  id: string;
  requiresApproval?: boolean;
  execute(context: StepContext): Promise<StepResult | void> | StepResult | void;
}

export interface StepContext {
  run: Readonly<DurableRun>;
  emitPartialOutput(value: unknown): void;
}

export interface RunStore {
  load(id: string): DurableRun | undefined;
  save(run: DurableRun): void;
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

  clear(): void {
    this.runs.clear();
  }
}

/** Persists durable run metadata through the native cache abstraction. */
export class NativeCacheRunStore implements RunStore {
  constructor(private readonly cache: LocalCache = new LocalCache()) {}

  load(id: string): DurableRun | undefined {
    return this.cache.getAgentRun<DurableRun>(id);
  }

  save(run: DurableRun): void {
    this.cache.setAgentRun(run.id, run);
  }
}

const now = (): string => new Date().toISOString();

export class DurableSessionRuntime {
  private readonly definitions = new Map<string, readonly AgentStep[]>();
  private readonly listeners = new Map<string, Set<(run: DurableRun) => void>>();

  constructor(private readonly store: RunStore = new NativeCacheRunStore()) {}

  createRun(id: string, task: string, steps: readonly AgentStep[]): DurableRun {
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

  async approve(id: string): Promise<DurableRun> {
    const run = this.requireRun(id);
    const stepId = run.pendingApprovalStepId;
    if (run.status !== "approval_required" || stepId === undefined) {
      throw new Error(`Run ${id} has no pending approval.`);
    }
    return this.execute({
      ...run,
      status: "running",
      pendingApprovalStepId: undefined,
      approvedStepIds: [...run.approvedStepIds, stepId],
    });
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
      if (step.requiresApproval && !run.approvedStepIds.includes(step.id)) {
        return this.persist({ ...run, status: "approval_required", pendingApprovalStepId: step.id });
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
}
