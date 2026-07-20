import assert from "node:assert/strict";
import test from "node:test";
import { LocalCache } from "../../src/native/cache.js";
import { NativeCache } from "../../src/native/bridge.js";

test("stores and retrieves encrypted values", () => {
  const cache = new LocalCache(new NativeCache({ masterKey: "test-key", native: undefined }));
  cache.setDocument("doc-1", { title: "Private document" });
  assert.deepEqual(cache.getDocument("doc-1"), { title: "Private document" });
});

test("deletes values", () => {
  const cache = new LocalCache(new NativeCache({ native: undefined }));
  cache.setDraft("draft-1", { body: "remove me" });
  cache.delete("draft:draft-1");
  assert.equal(cache.getDraft("draft-1"), undefined);
});

test("fallback storage does not contain plaintext", () => {
  const native = new NativeCache({ masterKey: "test-key", native: undefined });
  native.set("document:doc-1", JSON.stringify({ body: "not plaintext" }));
  assert.ok(![...native.storageSnapshot().values()].join(" ").includes("not plaintext"));
});

test("fallback mode works when the native library is unavailable", () => {
  const cache = new LocalCache(new NativeCache({ native: undefined }));
  cache.setPreference("theme", "dark");
  assert.equal(cache.getPreference("theme"), "dark");
});
