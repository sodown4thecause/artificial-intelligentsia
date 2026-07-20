import type { SignInRequest } from "./provider.js";
import type { SessionManager } from "./session.js";
import type { SessionSnapshot, Workspace } from "./types.js";

export class WorkspaceSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceSelectionError";
  }
}

/** Maintains one authorized workspace boundary for all workspace-scoped operations. */
export class WorkspaceSelectionController {
  private selectedWorkspaceId: string | undefined;

  constructor(private readonly sessions: SessionManager) {}

  get selectedWorkspace(): Workspace | undefined {
    const session = this.sessions.session;
    if (!session || !this.selectedWorkspaceId) return undefined;
    return session.workspaces.find((workspace) => workspace.id === this.selectedWorkspaceId);
  }

  async signIn(request: SignInRequest): Promise<SessionSnapshot> {
    this.clearSelection();
    return this.sessions.signIn(request);
  }

  async restore(): Promise<SessionSnapshot | undefined> {
    this.clearSelection();
    return this.sessions.restore();
  }

  selectWorkspace(workspaceId: string): Workspace {
    const session = this.requireSession();
    const workspace = session.workspaces.find((candidate) => candidate.id === workspaceId);
    const membership = session.memberships.find(
      (candidate) =>
        candidate.workspaceId === workspaceId && candidate.userId === session.user.id && candidate.status === "active",
    );
    if (!workspace || !membership) {
      throw new WorkspaceSelectionError("User is not authorized to select this workspace");
    }

    this.selectedWorkspaceId = workspace.id;
    return workspace;
  }

  /** Rejects both unauthenticated calls and requests targeting a different workspace. */
  requireWorkspaceAccess(workspaceId: string): Workspace {
    const workspace = this.selectedWorkspace;
    if (!workspace) throw new WorkspaceSelectionError("Select an authorized workspace before accessing workspace data");
    if (workspace.id !== workspaceId) {
      throw new WorkspaceSelectionError("Cross-workspace access is blocked");
    }
    return workspace;
  }

  async signOut(): Promise<void> {
    this.clearSelection();
    await this.sessions.signOut();
  }

  private clearSelection(): void {
    this.selectedWorkspaceId = undefined;
  }

  private requireSession(): SessionSnapshot {
    const session = this.sessions.session;
    if (!session) throw new WorkspaceSelectionError("Sign in before selecting a workspace");
    return session;
  }
}
