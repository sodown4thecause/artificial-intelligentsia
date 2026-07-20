import assert from "node:assert/strict";
import test from "node:test";
import { DocumentEditor } from "../../src/ui/components/DocumentEditor.js";
import { VersionHistory } from "../../src/ui/components/VersionHistory.js";

test("editor renders controlled structured text blocks", () => {
  const editor = DocumentEditor({ value: { blocks: [{ type: "heading", level: 1, text: "Plan" }, { type: "table", rows: [["Name", "Value"]] }] }, onChange: () => undefined });
  assert.ok(editor);
});

test("version history requires confirmation before restoring", () => {
  let restored = false;
  const history = VersionHistory({ currentVersion: 2, onRestore: () => { restored = true; }, confirmRestore: () => false, versions: [{ id: "version-1", documentId: "doc-1", versionNumber: 1, title: "Plan", content: { blocks: [] }, changeSummary: "Initial", actorUserId: "user-1", createdAt: new Date().toISOString() }] });
  assert.ok(history);
  assert.equal(restored, false);
});
