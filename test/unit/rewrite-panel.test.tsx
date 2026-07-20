import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RewriteEngine } from "../../src/rewrites/engine.js";
import { RewritePanel } from "../../src/ui/components/RewritePanel.js";

test("rewrite panel renders controls, detected protected content, and suggestion actions", () => {
  const engine = new RewriteEngine(async () => ({ suggestions: [] }));
  const markup = renderToStaticMarkup(<RewritePanel engine={engine} document={{
    id: "doc-1", workspaceId: "workspace-1", createdByUserId: "user-1", title: "Test",
    content: { blocks: [{ type: "paragraph", text: "Jane Doe has 42 tasks." }] }, visibility: "workspace",
    currentVersion: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  }} />);
  assert.match(markup, /Rewrite assistant/);
  assert.match(markup, /Jane Doe/);
  assert.match(markup, /Generate suggestions/);
  assert.match(markup, /Protect selection/);
});
