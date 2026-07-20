import assert from "node:assert/strict";
import test from "node:test";

type WorkspaceResource = Readonly<{
  workspaceId: string;
  kind: "memory" | "document" | "audit_log";
}>;

function canReadWorkspaceResource(requestWorkspaceId: string, resource: WorkspaceResource): boolean {
  return requestWorkspaceId === resource.workspaceId;
}

test("SEC-05: a workspace cannot read another workspace's memories", () => {
  const memory: WorkspaceResource = { workspaceId: "workspace-finance", kind: "memory" };

  assert.equal(canReadWorkspaceResource("workspace-product", memory), false);
});

test("SEC-05: a workspace cannot retrieve another workspace's documents by guessed identifier", () => {
  const document: WorkspaceResource = { workspaceId: "workspace-legal", kind: "document" };

  assert.equal(canReadWorkspaceResource("workspace-product", document), false);
});

test("SEC-05: audit logs remain scoped to their originating workspace", () => {
  const auditLog: WorkspaceResource = { workspaceId: "workspace-finance", kind: "audit_log" };

  assert.equal(canReadWorkspaceResource("workspace-support", auditLog), false);
});

test("SEC-05: resources remain readable within their own workspace", () => {
  const document: WorkspaceResource = { workspaceId: "workspace-product", kind: "document" };

  assert.equal(canReadWorkspaceResource("workspace-product", document), true);
});
