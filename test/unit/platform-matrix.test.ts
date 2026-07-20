import assert from "node:assert/strict";
import test from "node:test";
import {
  criticalDesktopFlowManifest,
  criticalDesktopFlowsFor,
  supportedDesktopPlatforms,
} from "../../src/desktop/platform-flows.js";
import { defaultNativeLibraryPath, nativeLibraryExtension } from "../../src/native/bridge.js";

const extensions = {
  win32: "dll",
  darwin: "dylib",
  linux: "so",
} as const;

test("native library extension and default path are deterministic for every supported platform", () => {
  for (const platform of supportedDesktopPlatforms) {
    const extension = extensions[platform];
    assert.equal(nativeLibraryExtension(platform), extension);
    assert.ok(
      defaultNativeLibraryPath(platform, "/virtual/creature")
        .replaceAll("\\", "/")
        .endsWith(`/native/zig/zig-out/lib/creature_native.${extension}`),
    );
  }
});

test("unknown platforms retain the Unix native-library fallback", () => {
  assert.equal(nativeLibraryExtension("freebsd"), "so");
  assert.ok(defaultNativeLibraryPath("freebsd", "/virtual/creature").endsWith("creature_native.so"));
});

test("every supported platform selects the same deterministic critical desktop flows", () => {
  for (const platform of supportedDesktopPlatforms) {
    assert.deepEqual(criticalDesktopFlowsFor(platform), criticalDesktopFlowManifest);
  }
});
