import assert from "node:assert/strict";
import test from "node:test";
import { ClipboardService } from "../../src/native/clipboard.js";

test("clipboard writes and reads text in fallback mode", () => {
  const clipboard = new ClipboardService();
  assert.equal(clipboard.writeText("Creature OS"), true);
  assert.equal(clipboard.readText(), "Creature OS");
});

test("clipboard text round-trips from a document selection", () => {
  const clipboard = new ClipboardService();
  assert.equal(clipboard.copyFromDocument({ text: "Selected thought", toString: () => "ignored" }), true);
  assert.equal(clipboard.readText(), "Selected thought");
});
