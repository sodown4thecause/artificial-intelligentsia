import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentShareDialog } from "../../src/ui/components/DocumentShareDialog.js";

test("DocumentShareDialog renders share form and existing users", () => {
  const html = renderToStaticMarkup(
    <DocumentShareDialog open={true} onShare={() => {}} onRevoke={() => {}} sharedUserIds={["user-2"]} onClose={() => {}} />,
  );
  assert.match(html, /Share document/);
  assert.match(html, /user-2/);
  assert.match(html, /Revoke/);
});

test("DocumentShareDialog is hidden when not open", () => {
  const html = renderToStaticMarkup(
    <DocumentShareDialog open={false} onShare={() => {}} onRevoke={() => {}} onClose={() => {}} />,
  );
  assert.equal(html, "");
});
