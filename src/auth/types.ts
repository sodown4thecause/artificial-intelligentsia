/** A person authenticated by an identity provider. */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

/** A tenant boundary. All workspace-scoped data must carry this identifier. */
export interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export type WorkspaceMembershipStatus = "active" | "invited" | "suspended" | "removed";
export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface WorkspaceMembership {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  status: WorkspaceMembershipStatus;
}

/** Tokens are retained only by the credential-backed session store. */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface AuthenticatedSession {
  providerId: string;
  user: AuthUser;
  workspaces: readonly Workspace[];
  memberships: readonly WorkspaceMembership[];
  tokens: AuthTokens;
}

/** The application-facing session deliberately excludes bearer tokens. */
export interface SessionSnapshot {
  providerId: string;
  user: AuthUser;
  workspaces: readonly Workspace[];
  memberships: readonly WorkspaceMembership[];
}
