import type { ApprovalRequest } from "./types.js";

export interface ApprovalPreview {
  readonly consequenceSummary: string;
  readonly target: string;
  readonly payloadSummary: string;
  readonly requiredFields: readonly string[];
}

export function buildApprovalPreview(request: ApprovalRequest): ApprovalPreview {
  return {
    consequenceSummary: `Approval is required before ${request.actionType} can affect ${request.target}.`,
    target: request.target,
    payloadSummary: request.payloadSummary,
    requiredFields: request.policy.requiredPreviewFields,
  };
}
