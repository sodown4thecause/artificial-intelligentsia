import type { ApprovalRequest } from "./types.js";

/** Durable implementations can persist this interface in the application's storage layer. */
export interface ApprovalStore {
  load(id: string): ApprovalRequest | undefined;
  save(request: ApprovalRequest): void;
  list(runId?: string): readonly ApprovalRequest[];
}

export class InMemoryApprovalStore implements ApprovalStore {
  private readonly requests = new Map<string, ApprovalRequest>();

  load(id: string): ApprovalRequest | undefined {
    const request = this.requests.get(id);
    return request === undefined ? undefined : structuredClone(request);
  }

  save(request: ApprovalRequest): void {
    this.requests.set(request.id, structuredClone(request));
  }

  list(runId?: string): readonly ApprovalRequest[] {
    return [...this.requests.values()]
      .filter((request) => runId === undefined || request.runId === runId)
      .map((request) => structuredClone(request));
  }
}
