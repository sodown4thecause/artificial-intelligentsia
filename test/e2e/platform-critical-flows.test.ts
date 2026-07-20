import assert from "node:assert/strict";
import test from "node:test";
import {
  criticalDesktopFlowManifest,
  criticalDesktopFlowsFor,
  supportedDesktopPlatforms,
} from "../../src/desktop/platform-flows.js";

test("win32, darwin, and linux run the same critical desktop flow manifest", () => {
  const expectedFlows = [
    "email-to-work",
    "document-improvement",
    "approval-resume",
    "automation-simulate-apply-reverse",
  ];

  assert.deepEqual(criticalDesktopFlowManifest, expectedFlows);
  for (const platform of supportedDesktopPlatforms) {
    assert.deepEqual(criticalDesktopFlowsFor(platform), expectedFlows, platform);
  }
});
