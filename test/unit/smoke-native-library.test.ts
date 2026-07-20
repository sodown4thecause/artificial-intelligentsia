import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { nativeLibraryFileName, nativeLibraryPath, parsePlatform, smokeNativeLibrary } from "../../scripts/smoke-native-library.js";

test("native artifact paths match Zig host library conventions", () => {
  assert.equal(nativeLibraryFileName("linux"), "libcreature_native.so");
  assert.equal(nativeLibraryFileName("macos"), "libcreature_native.dylib");
  assert.equal(nativeLibraryFileName("windows"), "creature_native.dll");
  assert.equal(nativeLibraryPath("linux", "repository"), path.join("repository", "native", "zig", "zig-out", "lib", "libcreature_native.so"));
});

test("native smoke requires an explicit known platform", () => {
  assert.throws(() => parsePlatform([]), /explicit --platform/);
  assert.throws(() => parsePlatform(["--platform", "darwin"]), /explicit --platform/);
  assert.equal(parsePlatform(["--platform", "windows"]), "windows");
});

test("native smoke fails when no artifact was built", () => {
  assert.throws(() => smokeNativeLibrary("linux", "missing-native-artifact"), /artifact is missing/);
});
