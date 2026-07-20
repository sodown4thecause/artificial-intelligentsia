import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasWorkspacePermission, requireWorkspacePermission, type WorkspaceAuthorizationContext } from "../../src/db/authz.js";
import { postgresConnectionOptions } from "../../src/db/client.js";
import { automationSchema, workspaceMemberSchema } from "../../src/db/types.js";

const schemaSql = readFileSync(new URL("../../src/db/schema.sql", import.meta.url), "utf8");
const id = "e8aa5f07-0d9d-43a0-8b52-b66d4106a5f7";
const timestamp = "2026-07-20T12:00:00.000Z";

describe("Creature PostgreSQL schema", () => {
  it("defines every required product table", () => {
    for (const table of ["users", "workspaces", "workspace_members", "permissions", "roles", "documents", "document_versions", "structured_records", "automations", "run_metadata", "audit_index"]) {
      assert.match(schemaSql, new RegExp(`CREATE TABLE ${table} \\(`));
    }
    assert.match(schemaSql, /CREATE TABLE role_permissions/);
    assert.match(schemaSql, /FOREIGN KEY \(role_id, workspace_id\) REFERENCES roles\(id, workspace_id\)/);
  });

  it("validates rows with the matching Zod schemas", () => {
    assert.equal(workspaceMemberSchema.parse({ workspaceId: id, userId: id, roleId: id, status: "active", invitedByUserId: null, joinedAt: timestamp, createdAt: timestamp, updatedAt: timestamp }).status, "active");
    assert.equal(automationSchema.parse({ id, workspaceId: id, ownerUserId: id, name: "Daily brief", description: null, mode: "simulation", triggerDefinition: {}, conditions: [], actions: [], exceptions: [], approvalPolicy: {}, limits: {}, failurePolicy: {}, notificationPolicy: {}, createdAt: timestamp, updatedAt: timestamp, deletedAt: null }).mode, "simulation");
  });
});

describe("workspace authorization", () => {
  const context: WorkspaceAuthorizationContext = {
    memberships: [
      { userId: "member", workspaceId: "workspace-a", roleId: "editor", status: "active" },
      { userId: "member", workspaceId: "workspace-b", roleId: "editor", status: "suspended" },
    ],
    roles: [{ id: "editor", permissionKeys: ["document.read", "document.write"] }],
  };

  it("requires an active membership in the requested workspace", () => {
    assert.equal(hasWorkspacePermission(context, "member", "workspace-a", "document.write"), true);
    assert.equal(hasWorkspacePermission(context, "member", "workspace-b", "document.write"), false);
    assert.equal(hasWorkspacePermission(context, "member", "workspace-a", "workspace.manage"), false);
    assert.throws(() => requireWorkspacePermission(context, "member", "workspace-b", "document.write"), /not authorized/);
  });
});

describe("PostgreSQL connection options", () => {
  it("uses DATABASE_URL when it is available", () => {
    assert.deepEqual(postgresConnectionOptions({ DATABASE_URL: "postgres://user:secret@localhost:5432/creature" }), { connectionString: "postgres://user:secret@localhost:5432/creature", ssl: false });
  });
});
