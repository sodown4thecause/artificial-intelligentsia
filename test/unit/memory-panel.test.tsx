import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryControls } from "../../src/memory/controls.js";
import { MemoryInspector } from "../../src/memory/inspection.js";
import { InMemoryMemoryRepository, MemoryStore } from "../../src/memory/store.js";
import { MemoryPanel } from "../../src/ui/components/MemoryPanel.js";
import type { MemoryCandidate, MemoryScope } from "../../src/memory/types.js";

const clock = () => new Date("2026-07-20T12:00:00.000Z");
const scope: MemoryScope = { userId: "user-1", workspaceId: "workspace-1" };

function inspector(): MemoryInspector {
  const store = new MemoryStore(new InMemoryMemoryRepository(), clock);
  const candidate: MemoryCandidate = { id: "candidate-1", type: "personal-preferences", content: "I prefer concise emails.", scope, provenance: { kind: "user-confirmed" }, status: "approved", createdAt: clock().toISOString() };
  store.writeCandidate(candidate);
  return new MemoryInspector(new MemoryControls(store));
}

test("MemoryPanel renders memory items and controls", () => {
  const html = renderToStaticMarkup(<MemoryPanel inspector={inspector()} scope={scope} />);
  assert.match(html, /Memory/);
  assert.match(html, /I prefer concise emails/);
  assert.match(html, /Pin/);
  assert.match(html, /Edit/);
  assert.match(html, /Delete/);
  assert.match(html, /Export/);
});

test("MemoryPanel shows empty state", () => {
  const store = new MemoryStore(new InMemoryMemoryRepository(), clock);
  const emptyInspector = new MemoryInspector(new MemoryControls(store));
  const html = renderToStaticMarkup(<MemoryPanel inspector={emptyInspector} scope={scope} />);
  assert.match(html, /No memory items/);
});
