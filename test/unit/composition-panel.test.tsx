import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CompositionPanel } from "../../src/ui/components/CompositionPanel.js";
import type { CompositionDraft } from "../../src/composition/types.js";

const draft: CompositionDraft = { id: "draft-1", workspaceId: "workspace-1", prompt: "Draft", content: { blocks: [{ type: "paragraph", text: "Preview text" }] }, status: "generated", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };

test("composition panel renders prompt, source selection, and draft actions", () => {
  const output = renderToStaticMarkup(<CompositionPanel workspaceId="workspace-1" sourceDocuments={[]} generate={async () => draft} save={async (value) => value} apply={async () => undefined} discard={async () => undefined} />);
  assert.match(output, /Prompt or outline/);
  assert.match(output, /Source document/);
  assert.match(output, /Generate draft/);
});
