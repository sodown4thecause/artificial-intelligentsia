import { getDefaultApprovalBehavior } from "./policy.js";
import { ActionDecision, ActionMetadata, PermissionClass } from "./types.js";

export interface ActionEvaluationContext {
  grantedScopes?: readonly string[];
  /** An explicitly configured rule that permits a local reversible write. */
  hasExplicitRule?: boolean;
  /** The user has reviewed the generated preview for this action. */
  previewConfirmed?: boolean;
  /** Explicit approval for this exact destructive or irreversible action. */
  hasPerActionApproval?: boolean;
}

/**
 * Applies Creature's default approval policy to an action. The returned decision
 * tells the caller whether to execute, collect a preview, request approval, or stop.
 */
export function evaluateAction(
  action: ActionMetadata,
  context: ActionEvaluationContext = {},
): ActionDecision {
  switch (getDefaultApprovalBehavior(action.permissionClass)) {
    case "auto-approve-within-granted-scopes":
      return hasGrantedScopes(action, context.grantedScopes) ? "auto-approve" : "blocked";
    case "auto-approve-with-explicit-rule":
      return context.hasExplicitRule ? "auto-approve" : "approve";
    case "preview-and-approval":
      return context.previewConfirmed ? "approve" : "preview-required";
    case "explicit-per-action-approval-or-blocked":
      return context.hasPerActionApproval ? "approve" : "blocked";
  }
}

function hasGrantedScopes(
  action: ActionMetadata,
  grantedScopes: readonly string[] | undefined,
): boolean {
  if (action.permissionClass !== PermissionClass.ReadOnly) {
    return false;
  }

  const grantedScopeSet = new Set(grantedScopes);
  return (action.requiredScopes ?? []).every((scope) => grantedScopeSet.has(scope));
}
