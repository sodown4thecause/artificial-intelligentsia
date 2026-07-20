export type ApprovalStatus = "pending" | "approved" | "denied" | "revoked" | "expired";
export type ApprovalDecisionKind = "approve" | "deny" | "revoke";

export interface ApprovalPolicy {
  readonly whoCanApprove: readonly string[];
  readonly expiresInMs?: number;
  readonly requiredPreviewFields: readonly string[];
}

export interface ApprovalRequest {
  readonly id: string;
  readonly runId?: string;
  readonly stepId?: string;
  readonly actionType: string;
  readonly target: string;
  readonly payloadSummary: string;
  readonly payloadFingerprint: string;
  readonly policy: ApprovalPolicy;
  readonly requestedBy: string;
  readonly requestedAt: string;
  readonly status: ApprovalStatus;
  readonly decidedBy?: string;
  readonly decidedAt?: string;
  readonly reason?: string;
  readonly expiresAt?: string;
}

export interface ApprovalDecision {
  readonly decision: ApprovalDecisionKind;
  readonly actor: string;
  readonly timestamp: string;
  readonly reason?: string;
}

export interface ApprovalAuditEvent {
  readonly type: "request" | "approve" | "deny" | "revoke" | "execute" | "expire";
  readonly requestId: string;
  readonly runId?: string;
  readonly actor: string;
  readonly occurredAt: string;
  readonly reason?: string;
}
