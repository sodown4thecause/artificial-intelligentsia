import assert from "node:assert/strict";
import test from "node:test";
import { createDevelopmentAuthProvider } from "../../src/auth/provider.js";
import { CredentialSessionStore, type OsCredentialService, SessionManager } from "../../src/auth/session.js";
import { WorkspaceSelectionController, WorkspaceSelectionError } from "../../src/auth/workspace.js";

class TestCredentialService implements OsCredentialService {
  readonly values = new Map<string, string>();

  async getPassword(service: string, account: string): Promise<string | undefined> {
    return this.values.get(`${service}:${account}`);
  }

  async setPassword(service: string, account: string, password: string): Promise<void> {
    this.values.set(`${service}:${account}`, password);
  }

  async deletePassword(service: string, account: string): Promise<void> {
    this.values.delete(`${service}:${account}`);
  }
}

function createAuthentication(): { authentication: WorkspaceSelectionController; credentials: TestCredentialService } {
  const credentials = new TestCredentialService();
  const provider = createDevelopmentAuthProvider({
    user: { id: "user-1", email: "ada@example.com", displayName: "Ada" },
    workspaces: [
      { id: "workspace-a", name: "Alpha", slug: "alpha" },
      { id: "workspace-b", name: "Beta", slug: "beta" },
    ],
    memberships: [
      { userId: "user-1", workspaceId: "workspace-a", role: "member", status: "active" },
      { userId: "user-1", workspaceId: "workspace-b", role: "viewer", status: "invited" },
    ],
  });
  const sessions = new SessionManager(provider, new CredentialSessionStore(credentials));
  return { authentication: new WorkspaceSelectionController(sessions), credentials };
}

test("a user can sign in and select an authorized workspace", async () => {
  const { authentication } = createAuthentication();
  const session = await authentication.signIn({ kind: "development" });

  assert.equal(session.user.email, "ada@example.com");
  assert.equal("tokens" in session, false);
  assert.equal(authentication.selectWorkspace("workspace-a").name, "Alpha");
  assert.equal(authentication.requireWorkspaceAccess("workspace-a").slug, "alpha");
  assert.throws(() => authentication.selectWorkspace("workspace-b"), WorkspaceSelectionError);
});

test("cross-workspace access is blocked even for a workspace listed by the provider", async () => {
  const { authentication } = createAuthentication();
  await authentication.signIn({ kind: "development" });
  authentication.selectWorkspace("workspace-a");

  assert.throws(() => authentication.requireWorkspaceAccess("workspace-b"), /Cross-workspace access is blocked/);
});

test("sign-out clears the credential-backed session and workspace selection", async () => {
  const { authentication, credentials } = createAuthentication();
  await authentication.signIn({ kind: "development" });
  authentication.selectWorkspace("workspace-a");

  const storedSession = credentials.values.get("creature-os:authenticated-session");
  assert.ok(storedSession);
  assert.notEqual(storedSession, "development-access-token");
  await authentication.signOut();

  assert.equal(credentials.values.size, 0);
  assert.equal(authentication.selectedWorkspace, undefined);
  assert.throws(() => authentication.requireWorkspaceAccess("workspace-a"), WorkspaceSelectionError);
});
