import { createHash, randomUUID } from "node:crypto";

import { InMemoryApprovalStore, type ApprovalStore } from "./store.js";
import type { ApprovalAuditEvent, ApprovalDecision, ApprovalPolicy, ApprovalRequest } from "./types.js";

export interface CreateApprovalRequest {
  readonly runId?: string;
  readonly stepId?: string;
  readonly actionType: string;
  readonly target: string;
  readonly payload: unknown;
  readonly payloadSummary: string;
  readonly policy: ApprovalPolicy;
  readonly requestedBy: string;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
}

export function fingerprintApprovalPayload(payload: unknown): string {
  return createHash("sha256").update(canonicalize(payload)).digest("hex");
}

export class ApprovalGate {
  private readonly auditEvents: ApprovalAuditEvent[] = [];
  private readonly now: () => Date;

  constructor(
    private readonly store: ApprovalStore = new InMemoryApprovalStore(),
    options: { now?: () => Date } = {},
  ) {
    this.now = options.now ?? (() => new Date());
  }

  create(input: CreateApprovalRequest): ApprovalRequest {
    const requestedAt = this.now().toISOString();
    const expiresAt = input.policy.expiresInMs === undefined
      ? undefined
      : new Date(this.now().getTime() + input.policy.expiresInMs).toISOString();
    const request: ApprovalRequest = {
      id: `approval_${randomUUID()}`,
      runId: input.runId,
      stepId: input.stepId,
      actionType: input.actionType,
      target: input.target,
      payloadSummary: input.payloadSummary,
      payloadFingerprint: fingerprintApprovalPayload(input.payload),
      policy: structuredClone(input.policy),
      requestedBy: input.requestedBy,
      requestedAt,
      status: "pending",
      expiresAt,
    };
    this.store.save(request);
    this.record("request", request, input.requestedBy, requestedAt);
    return request;
  }

  get(id: string): ApprovalRequest | undefined {
    const request = this.store.load(id);
    return request === undefined ? undefined : this.expireIfNeeded(request);
  }

  list(runId?: string): readonly ApprovalRequest[] {
    return this.store.list(runId).map((request) => this.expireIfNeeded(request));
  }

  approve(id: string, actor: string, reason?: string): ApprovalRequest {
    return this.decide(id, { decision: "approve", actor, timestamp: this.now().toISOString(), reason });
  }

  deny(id: string, actor: string, reason?: string): ApprovalRequest {
    return this.decide(id, { decision: "deny", actor, timestamp: this.now().toISOString(), reason });
  }

  revoke(id: string, actor: string, reason?: string): ApprovalRequest {
    return this.decide(id, { decision: "revoke", actor, timestamp: this.now().toISOString(), reason });
  }

  decide(id: string, decision: ApprovalDecision): ApprovalRequest {
    const request = this.require(id);
    const current = this.expireIfNeeded(request);
    if (current.status === "expired") throw new Error(`Approval request ${id} has expired.`);
    if (!current.policy.whoCanApprove.includes("*") && !current.policy.whoCanApprove.includes(decision.actor)) {
      throw new Error(`Actor ${decision.actor} cannot decide approval request ${id}.`);
    }
    const permitted = decision.decision === "revoke" ? current.status === "approved" || current.status === "pending" : current.status === "pending";
    if (!permitted) throw new Error(`Approval request ${id} cannot be ${decision.decision}d from ${current.status}.`);
    const status = decision.decision === "approve" ? "approved" : decision.decision === "deny" ? "denied" : "revoked";
    const updated: ApprovalRequest = {
      ...current,
      status,
      decidedBy: decision.actor,
      decidedAt: decision.timestamp,
      reason: decision.reason,
    };
    this.store.save(updated);
    this.record(decision.decision, updated, decision.actor, decision.timestamp, decision.reason);
    return updated;
  }

  assertApproved(id: string, payload: unknown, actor = "system"): ApprovalRequest {
    const request = this.expireIfNeeded(this.require(id));
    if (request.status !== "approved") throw new Error(`Approval request ${id} is ${request.status}; execution is blocked.`);
    if (request.payloadFingerprint !== fingerprintApprovalPayload(payload)) {
      throw new Error(`Approval request ${id} does not match the action payload.`);
    }
    this.record("execute", request, actor, this.now().toISOString());
    return request;
  }

  getAuditEvents(): readonly ApprovalAuditEvent[] {
    return [...this.auditEvents];
  }

  private require(id: string): ApprovalRequest {
    const request = this.store.load(id);
    if (request === undefined) throw new Error(`Unknown approval request ${id}.`);
    return request;
  }

  private expireIfNeeded(request: ApprovalRequest): ApprovalRequest {
    if (request.status === "pending" && request.expiresAt !== undefined && Date.parse(request.expiresAt) <= this.now().getTime()) {
      const expired = { ...request, status: "expired" as const };
      this.store.save(expired);
      this.record("expire", expired, "system", this.now().toISOString());
      return expired;
    }
    return request;
  }

  private record(type: ApprovalAuditEvent["type"], request: ApprovalRequest, actor: string, occurredAt: string, reason?: string): void {
    this.auditEvents.push({ type, requestId: request.id, runId: request.runId, actor, occurredAt, reason });
  }
}
