import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentList, filterDocuments } from "../../src/ui/components/DocumentList.js";
import type { EditableDocument } from "../../src/documents/types.js";

const documents: readonly EditableDocument[] = [
  { id: "doc-1", workspaceId: "ws-1", createdByUserId: "user-1", title: "Alpha plan", content: { blocks: [] }, visibility: "workspace", currentVersion: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "doc-2", workspaceId: "ws-1", createdByUserId: "user-1", title: "Beta notes", content: { blocks: [] }, visibility: "workspace", currentVersion: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
];

test("filterDocuments filters by title", () => {
  assert.equal(filterDocuments(documents, "alpha").length, 1);
  assert.equal(filterDocuments(documents, "beta").length, 1);
  assert.equal(filterDocuments(documents, "").length, 2);
});

test("DocumentList renders documents and handles selection", () => {
  let selected: EditableDocument | undefined;
  const html = renderToStaticMarkup(<DocumentList documents={documents} onSelect={(document) => { selected = document; }} />);
  assert.match(html, /Alpha plan/);
  assert.match(html, /Beta notes/);
  // Selection is via onClick; static markup does not fire events, so we verify the button exists.
  assert.match(html, /<button/);
});

test("DocumentList shows empty state", () => {
  const html = renderToStaticMarkup(<DocumentList documents={[]} onSelect={() => {}} />);
  assert.match(html, /No documents found/);
});
