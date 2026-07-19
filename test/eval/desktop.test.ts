import assert from "node:assert/strict";
import test from "node:test";
import { bootstrapDesktop } from "../../src/desktop/main.js";

test("desktop shell starts, exposes a tray, and caches a document", async () => {
  const desktop = await bootstrapDesktop();
  await desktop.tray.show();
  await desktop.cache.set("document:eval", { id: "eval", title: "Desktop shell" });

  assert.deepEqual(await desktop.cache.get("document:eval"), {
    id: "eval",
    title: "Desktop shell",
  });
});
