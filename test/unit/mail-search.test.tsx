import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MailSearch } from "../../src/ui/components/MailSearch.js";

test("renders Gmail filters, grouped results, and selected thread", () => {
  const markup = renderToStaticMarkup(<MailSearch onSearch={() => undefined} onSelectThread={() => undefined} selectedThreadId="thread-1" result={{ query: {}, threads: [{ id: "thread-1", subject: "Renewal", latestMessageAt: new Date(), messages: [{ id: "message-1", threadId: "thread-1", from: "customer@example.test", to: [], subject: "Renewal", body: "body", receivedAt: new Date(), labels: [] }] }] }} />);
  assert.match(markup, /Search Gmail/);
  assert.match(markup, /From/);
  assert.match(markup, /Renewal/);
  assert.match(markup, /aria-pressed="true"/);
});
