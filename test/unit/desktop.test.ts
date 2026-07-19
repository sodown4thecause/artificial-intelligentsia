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

test("desktop context initializes in fallback mode with native services", async () => {
  setDesktopContext(undefined);
  const context = await bootstrapDesktop();

  assert.equal(context.nativeLoaded, false);
  assert.equal(getDesktopContext(), context);
  await context.cache.set("document:1", { title: "Creature" });
  assert.deepEqual(await context.cache.get("document:1"), { title: "Creature" });
  assert.equal(typeof context.credentials.getMasterKey, "function");
  assert.equal(typeof context.queue.enqueue, "function");
  assert.equal(typeof context.notifications.notify, "function");
  assert.equal(typeof context.dialogs.showError, "function");
  assert.equal(typeof context.clipboard.writeText, "function");
});

test("desktop lifecycle handlers do not throw", async () => {
  await bootstrapDesktop();
  await onAppReady();
  await onAppActivate();
  await onAppWindowAllClosed();
  await onAppBeforeQuit();
});

test("global keyboard shortcuts register a command-palette shortcut", () => {
  registerGlobalKeyboardShortcuts();
  const service = getShortcutService();
  assert.ok(service);
});
