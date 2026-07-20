import type { ApprovalPolicy } from "./types.js";

export const mailSendApprovalPolicy: ApprovalPolicy = {
  whoCanApprove: ["*"],
  expiresInMs: 15 * 60 * 1000,
  requiredPreviewFields: ["recipient", "subject", "body"],
};

export const externalWriteApprovalPolicy: ApprovalPolicy = {
  whoCanApprove: ["*"],
  expiresInMs: 15 * 60 * 1000,
  requiredPreviewFields: ["target", "payload"],
};

export const automationActionApprovalPolicy: ApprovalPolicy = {
  whoCanApprove: ["*"],
  expiresInMs: 15 * 60 * 1000,
  requiredPreviewFields: ["action", "target", "payload"],
};
