import { ApprovalBehavior, PermissionClass } from "./types.js";

/** Default approval behavior. Individual policies may only narrow these defaults. */
export const DEFAULT_APPROVAL_POLICY: Readonly<Record<PermissionClass, ApprovalBehavior>> = {
  [PermissionClass.ReadOnly]: "auto-approve-within-granted-scopes",
  [PermissionClass.LocalReversibleWrite]: "auto-approve-with-explicit-rule",
  [PermissionClass.ExternalReversibleWrite]: "preview-and-approval",
  [PermissionClass.ExternalConsequentialWrite]: "preview-and-approval",
  [PermissionClass.DestructiveOrIrreversible]: "explicit-per-action-approval-or-blocked",
};

export function getDefaultApprovalBehavior(permissionClass: PermissionClass): ApprovalBehavior {
  return DEFAULT_APPROVAL_POLICY[permissionClass];
}
