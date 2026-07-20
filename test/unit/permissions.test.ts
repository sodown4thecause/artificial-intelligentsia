import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAction } from "../../src/core/permissions/gate.js";
import { DEFAULT_APPROVAL_POLICY } from "../../src/core/permissions/policy.js";
import { defineTool, ToolRegistry } from "../../src/core/permissions/tool-registry.js";
import { PermissionClass } from "../../src/core/permissions/types.js";

test("approval policy defines the expected default for every permission class", () => {
  assert.equal(
    DEFAULT_APPROVAL_POLICY[PermissionClass.ReadOnly],
    "auto-approve-within-granted-scopes",
  );
  assert.equal(
    DEFAULT_APPROVAL_POLICY[PermissionClass.LocalReversibleWrite],
    "auto-approve-with-explicit-rule",
  );
  assert.equal(
    DEFAULT_APPROVAL_POLICY[PermissionClass.ExternalReversibleWrite],
    "preview-and-approval",
  );
  assert.equal(
    DEFAULT_APPROVAL_POLICY[PermissionClass.ExternalConsequentialWrite],
    "preview-and-approval",
  );
  assert.equal(
    DEFAULT_APPROVAL_POLICY[PermissionClass.DestructiveOrIrreversible],
    "explicit-per-action-approval-or-blocked",
  );
});

test("read-only actions auto-approve only in granted scopes", () => {
  const action = {
    id: "calendar.read",
    permissionClass: PermissionClass.ReadOnly,
    requiredScopes: ["calendar"],
  };

  assert.equal(evaluateAction(action, { grantedScopes: ["calendar"] }), "auto-approve");
  assert.equal(evaluateAction(action), "blocked");
});

test("local reversible writes require an explicit rule to auto-approve", () => {
  const action = { id: "note.update", permissionClass: PermissionClass.LocalReversibleWrite };

  assert.equal(evaluateAction(action), "approve");
  assert.equal(evaluateAction(action, { hasExplicitRule: true }), "auto-approve");
});

test("external writes require a preview before approval", () => {
  for (const permissionClass of [
    PermissionClass.ExternalReversibleWrite,
    PermissionClass.ExternalConsequentialWrite,
  ]) {
    const action = { id: `${permissionClass}.action`, permissionClass };
    assert.equal(evaluateAction(action), "preview-required");
    assert.equal(evaluateAction(action, { previewConfirmed: true }), "approve");
  }
});

test("destructive actions are blocked without exact approval", () => {
  const action = {
    id: "workspace.delete",
    permissionClass: PermissionClass.DestructiveOrIrreversible,
  };

  assert.equal(evaluateAction(action), "blocked");
  assert.equal(evaluateAction(action, { hasPerActionApproval: true }), "approve");
});

test("tool registry preserves declared permission metadata", () => {
  const registry = new ToolRegistry();
  const tool = defineTool("email.send", "Send email", PermissionClass.ExternalConsequentialWrite);

  registry.register(tool);

  assert.equal(registry.has(tool.id), true);
  assert.deepEqual(registry.get(tool.id), tool);
  assert.throws(() => registry.register(tool), /already registered/);
});
