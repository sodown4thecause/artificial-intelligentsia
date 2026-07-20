import { strict as assert } from "node:assert";
import test from "node:test";

import {
  COLD_START_CI_THRESHOLD_MS,
  measureDesktopBootstrap,
  onLifecycleTiming,
} from "../../src/desktop/lifecycle.js";

test("desktop bootstrap emits timing events within the CI threshold", async () => {
  const events: Array<{ phase: string; durationMs?: number }> = [];
  const unsubscribe = onLifecycleTiming((event) => events.push(event));

  try {
    const durationMs = await measureDesktopBootstrap(async () => undefined);

    assert.ok(durationMs < COLD_START_CI_THRESHOLD_MS);
    assert.deepEqual(events.map((event) => event.phase), ["started", "completed"]);
    assert.ok((events[1]?.durationMs ?? Infinity) < COLD_START_CI_THRESHOLD_MS);
  } finally {
    unsubscribe();
  }
});
