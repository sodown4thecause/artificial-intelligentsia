import type { SearchAccessPolicy, SearchDocument, SearchPrincipal } from "./types.js";

/** Returns true only when every document access boundary is satisfied. */
export function canAccessSearchPolicy(
  policy: SearchAccessPolicy,
  principal: SearchPrincipal,
): boolean {
  if (policy.workspaceId !== principal.workspaceId) return false;
  if (policy.ownerId === principal.userId) return hasRequiredScopes(policy, principal);

  const isExplicitlyAllowed = policy.allowedUserIds?.includes(principal.userId) ?? false;
  const groups = principal.groupIds ?? [];
  const hasAllowedGroup = policy.allowedGroupIds?.some((groupId) => groups.includes(groupId)) ?? false;

  if (!isExplicitlyAllowed && !hasAllowedGroup) return false;
  return hasRequiredScopes(policy, principal);
}

/** Applies authorization before any caller can inspect document content or metadata. */
export function filterPermittedDocuments(
  documents: Iterable<SearchDocument>,
  principal: SearchPrincipal,
): SearchDocument[] {
  return Array.from(documents).filter((document) => canAccessSearchPolicy(document.access, principal));
}

function hasRequiredScopes(policy: SearchAccessPolicy, principal: SearchPrincipal): boolean {
  const grantedScopes = principal.scopes ?? [];
  return policy.requiredScopes?.every((scope) => grantedScopes.includes(scope)) ?? true;
}
