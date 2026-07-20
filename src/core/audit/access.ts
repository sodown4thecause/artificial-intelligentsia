/** Roles permitted to inspect complete audit lineage within a workspace. */
export type AuditReaderRole = 'owner' | 'admin' | 'auditor';

export interface AuditAccessPrincipal {
  id: string;
  workspaceRoles: Readonly<Record<string, AuditReaderRole | readonly AuditReaderRole[]>>;
}

export class AuditAccessDeniedError extends Error {
  constructor(workspaceId: string) {
    super(`Principal is not authorized to read audit records for workspace ${workspaceId}`);
    this.name = 'AuditAccessDeniedError';
  }
}

export function canReadAuditWorkspace(
  principal: AuditAccessPrincipal,
  workspaceId: string,
): boolean {
  const roles = principal.workspaceRoles[workspaceId];
  return (
    roles !== undefined &&
    (Array.isArray(roles)
      ? roles.some((role) => role === 'owner' || role === 'admin' || role === 'auditor')
      : roles === 'owner' || roles === 'admin' || roles === 'auditor')
  );
}

export function assertCanReadAuditWorkspace(
  principal: AuditAccessPrincipal,
  workspaceId: string,
): void {
  if (!canReadAuditWorkspace(principal, workspaceId)) {
    throw new AuditAccessDeniedError(workspaceId);
  }
}
