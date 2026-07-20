import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ProofreaderPanel } from "../../src/ui/components/ProofreaderPanel.js";

const issue = { id: "issue-1", documentId: "doc-1", baseVersion: 1, blockIndex: 0, start: 0, end: 3, originalText: "teh", suggestedText: "the", category: "spelling" as const, severity: "low" as const, explanation: "Spelling correction", status: "pending" as const };

test("proofreader panel renders grouped issues and batch actions", () => {
  const output = renderToStaticMarkup(<ProofreaderPanel issues={[issue]} onAccept={async (value) => ({ ...value, status: "accepted" })} onReject={async (value) => ({ ...value, status: "rejected" })} onBatchAccept={async (values) => values} onBatchReject={async (values) => values} onApply={async () => undefined} />);
  assert.match(output, /spelling/);
  assert.match(output, /Accept all/);
  assert.match(output, /Reject all/);
});
