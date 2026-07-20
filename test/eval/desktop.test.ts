import assert from "node:assert/strict";
import test from "node:test";
import { bootstrapDesktop } from "../../src/desktop/main.js";

test("desktop shell starts, exposes a tray, and caches a document", async () => {
  process.env.CREATURE_CACHE_MASTER_KEY = "test-master-key-eval-desktop";
  process.env.BRAINTRUST_API_KEY = "test-bt-key";
  process.env.BRAINTRUST_PROJECT = "test-bt-project";
  process.env.AI_GATEWAY_API_KEY = "test-gateway-key";
  process.env.AI_GATEWAY_BASE_URL = "https://gateway.test";
  process.env.VERCEL_ENV = "preview";
  process.env.VERCEL_URL = "creature-test.vercel.app";
  process.env.DATABASE_URL = "postgresql://creature:test@localhost:5432/creature_test";
  const desktop = await bootstrapDesktop();
  await desktop.tray.show();
  await desktop.cache.set("document:eval", { id: "eval", title: "Desktop shell" });

  assert.deepEqual(await desktop.cache.get("document:eval"), {
    id: "eval",
    title: "Desktop shell",
  });
});
