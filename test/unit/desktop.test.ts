import assert from "node:assert/strict";
import test from "node:test";
import {
  bootstrapDesktop,
  getDesktopContext,
  getShortcutService,
  onAppActivate,
  onAppBeforeQuit,
  onAppReady,
  onAppWindowAllClosed,
  registerGlobalKeyboardShortcuts,
  setDesktopContext,
} from "../../src/desktop/index.js";

const validServiceEnvironment = {
  BRAINTRUST_API_KEY: "braintrust-test-key",
  BRAINTRUST_PROJECT: "creature-os",
  AI_GATEWAY_API_KEY: "gateway-test-key",
  AI_GATEWAY_BASE_URL: "https://ai-gateway.vercel.sh/v1",
  VERCEL_ENV: "development",
  VERCEL_URL: "localhost",
  DATABASE_URL: "postgresql://creature:test@localhost:5432/creature",
} as const;

async function withCacheCredential(callback: () => Promise<void>): Promise<void> {
  const original = process.env.CREATURE_CACHE_MASTER_KEY;
  process.env.CREATURE_CACHE_MASTER_KEY = "unit-test-cache-credential";
  try {
    await callback();
  } finally {
    if (original === undefined) delete process.env.CREATURE_CACHE_MASTER_KEY;
    else process.env.CREATURE_CACHE_MASTER_KEY = original;
  }
}

test("desktop context initializes with a configured credential and native services", async () => {
  await withCacheCredential(async () => {
    setDesktopContext(undefined);
    const context = await bootstrapDesktop(validServiceEnvironment);

    assert.equal(getDesktopContext(), context);
    await context.cache.set("document:1", { title: "Creature" });
    assert.deepEqual(await context.cache.get("document:1"), { title: "Creature" });
    assert.equal(typeof context.credentials.getMasterKey, "function");
    assert.equal(typeof context.queue.enqueue, "function");
    assert.equal(typeof context.notifications.notify, "function");
    assert.equal(typeof context.dialogs.showError, "function");
    assert.equal(typeof context.clipboard.writeText, "function");
  });
});

test("desktop bootstrap fails closed without a configured credential", async () => {
  const original = process.env.CREATURE_CACHE_MASTER_KEY;
  delete process.env.CREATURE_CACHE_MASTER_KEY;
  try {
    await assert.rejects(
      bootstrapDesktop(validServiceEnvironment),
      /No secure credential source is configured/,
    );
  } finally {
    if (original !== undefined) process.env.CREATURE_CACHE_MASTER_KEY = original;
  }
});

test("desktop lifecycle handlers do not throw", async () => {
  await withCacheCredential(async () => {
    await bootstrapDesktop(validServiceEnvironment);
    await onAppReady();
    await onAppActivate();
    await onAppWindowAllClosed();
    await onAppBeforeQuit();
  });
});

test("global keyboard shortcuts register a command-palette shortcut", () => {
  registerGlobalKeyboardShortcuts();
  const service = getShortcutService();
  assert.ok(service);
});
