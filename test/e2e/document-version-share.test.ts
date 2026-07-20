import assert from "node:assert/strict";
import test from "node:test";

type DocumentVersion = { number: number; content: string };

class MockDocumentWorkspace {
  readonly externalActions: string[] = [];
  private versions: DocumentVersion[] = [];

  create(content: string): void { this.versions.push({ number: 1, content }); }
  edit(content: string): void { this.versions.push({ number: this.versions.length + 1, content }); }
  latest(): DocumentVersion { return this.versions.at(-1)!; }

  async share(email: string, permission: "view" | "comment" | "edit", approved: boolean): Promise<void> {
    if (!approved) throw new Error("Approval is required before sharing a document");
    this.externalActions.push(`share:${email}:${permission}`);
  }
}

test("creates, edits, versions, and shares a document with basic permissions", async () => {
  const workspace = new MockDocumentWorkspace();
  workspace.create("Renewal plan");
  workspace.edit("Renewal plan\n\nTerms approved by finance.");

  assert.deepEqual(workspace.latest(), { number: 2, content: "Renewal plan\n\nTerms approved by finance." });
  await assert.rejects(() => workspace.share("teammate@example.test", "comment", false), /Approval is required/);
  assert.deepEqual(workspace.externalActions, []);

  await workspace.share("teammate@example.test", "comment", true);
  assert.deepEqual(workspace.externalActions, ["share:teammate@example.test:comment"]);
});
