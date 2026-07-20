/** The risk classification declared by every executable tool action. */
export enum PermissionClass {
  ReadOnly = "read-only",
  LocalReversibleWrite = "local-reversible-write",
  ExternalReversibleWrite = "external-reversible-write",
  ExternalConsequentialWrite = "external-consequential-write",
  DestructiveOrIrreversible = "destructive-or-irreversible",
}

/** Describes an action before it is evaluated by the approval gate. */
export interface ActionMetadata {
  /** A stable identifier used for policy rules and per-action approvals. */
  id: string;
  permissionClass: PermissionClass;
  /** Scopes that must already be granted for read-only actions. */
  requiredScopes?: readonly string[];
  description?: string;
}

export type ApprovalBehavior =
  | "auto-approve-within-granted-scopes"
  | "auto-approve-with-explicit-rule"
  | "preview-and-approval"
  | "explicit-per-action-approval-or-blocked";

export type ActionDecision =
  | "approve"
  | "auto-approve"
  | "preview-required"
  | "blocked";
