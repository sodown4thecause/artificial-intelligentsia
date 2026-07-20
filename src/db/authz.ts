export interface WorkspaceMembership {
  workspaceId: string;
  userId: string;
  roleId: string;
  status: "active" | "invited" | "suspended" | "removed";
}

export interface WorkspaceRole {
  id: string;
  permissionKeys: readonly string[];
}

export interface WorkspaceAuthorizationContext {
  memberships: readonly WorkspaceMembership[];
  roles: readonly WorkspaceRole[];
}

export class WorkspaceAuthorizationError extends Error {
  constructor(workspaceId: string, permissionKey: string) {
    super(`User is not authorized for ${permissionKey} in workspace ${workspaceId}`);
    this.name = "WorkspaceAuthorizationError";
  }
}

export function getActiveWorkspaceMembership(
  context: WorkspaceAuthorizationContext,
  userId: string,
  workspaceId: string,
): WorkspaceMembership | undefined {
  return context.memberships.find(
    (membership) => membership.userId === userId && membership.workspaceId === workspaceId && membership.status === "active",
  );
}

export function hasWorkspacePermission(
  context: WorkspaceAuthorizationContext,
  userId: string,
  workspaceId: string,
  permissionKey: string,
): boolean {
  const membership = getActiveWorkspaceMembership(context, userId, workspaceId);
  if (!membership) {
    return false;
  }

  const role = context.roles.find((candidate) => candidate.id === membership.roleId);
  return role?.permissionKeys.includes(permissionKey) ?? false;
}

export function requireWorkspacePermission(
  context: WorkspaceAuthorizationContext,
  userId: string,
  workspaceId: string,
  permissionKey: string,
): void {
  if (!hasWorkspacePermission(context, userId, workspaceId, permissionKey)) {
    throw new WorkspaceAuthorizationError(workspaceId, permissionKey);
  }
}
