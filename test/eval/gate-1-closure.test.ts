import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const closureRecord = await readFile(
  new URL("../../docs/gates/gate-1-closure.md", import.meta.url),
  "utf8",
);

test("Gate 1 closure record assesses every PRD acceptance criterion", () => {
  for (let criterion = 1; criterion <= 13; criterion += 1) {
    assert.match(closureRecord, new RegExp(`\\| ${criterion}\\.\\s`));
  }
});

test("Gate 1 closure record retains its blocked human and provider caveats", () => {
  for (const requiredCaveat of [
    "**Gate status: BLOCKED.**",
    "D1 — Product/module naming",
    "**OPEN**",
    "live Eve and AI SDK 7 traces",
    "Vercel Connect",
    "Windows, macOS, and Linux",
    "keyring",
    "seven consecutive calendar days of human beta observation",
    "rollback drill",
    "named human sign-offs",
    "Deterministic fixtures must not be presented as live, native, or human evidence.",
  ]) {
    assert.ok(closureRecord.includes(requiredCaveat), `missing caveat: ${requiredCaveat}`);
  }
});
