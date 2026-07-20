import assert from "node:assert/strict";
import test from "node:test";

type ConsequentialWrite = Readonly<{
  workspaceId: string;
  action: "delete_document" | "send_email" | "transfer_funds";
  approval: Readonly<{ workspaceId: string; action: ConsequentialWrite["action"] }> | undefined;
}>;

function mayExecute(write: ConsequentialWrite): boolean {
  return write.approval?.workspaceId === write.workspaceId && write.approval.action === write.action;
}

test("SEC-05: destructive document deletion is rejected without explicit approval", () => {
  const request: ConsequentialWrite = {
    workspaceId: "workspace-product",
    action: "delete_document",
    approval: undefined,
  };

  assert.equal(mayExecute(request), false);
});

test("SEC-05: prompt text claiming approval cannot authorize an email send", () => {
  const request: ConsequentialWrite = {
    workspaceId: "workspace-product",
    action: "send_email",
    approval: undefined,
  };

  assert.equal(mayExecute(request), false);
});

test("SEC-05: approval for one action cannot be reused for a fund transfer", () => {
  const request: ConsequentialWrite = {
    workspaceId: "workspace-finance",
    action: "transfer_funds",
    approval: { workspaceId: "workspace-finance", action: "send_email" },
  };

  assert.equal(mayExecute(request), false);
});

test("SEC-05: approval from another workspace cannot authorize a destructive write", () => {
  const request: ConsequentialWrite = {
    workspaceId: "workspace-product",
    action: "delete_document",
    approval: { workspaceId: "workspace-finance", action: "delete_document" },
  };

  assert.equal(mayExecute(request), false);
});
