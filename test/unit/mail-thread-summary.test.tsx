import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MailThreadSummary } from "../../src/ui/components/MailThreadSummary.js";

test("renders a cited summary and draft action", () => {
  const markup = renderToStaticMarkup(<MailThreadSummary onCreateDraft={() => undefined} summary={{ threadId: "thread-1", summary: "Customer requested renewal terms.", citations: [{ messageId: "message-1", threadId: "thread-1", label: "customer@example.test: Renewal" }] }} />);
  assert.match(markup, /Customer requested renewal terms/);
  assert.match(markup, /message-1/);
  assert.match(markup, /Create draft/);
});
