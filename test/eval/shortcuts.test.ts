import assert from "node:assert/strict";
import test from "node:test";
import { CommandPaletteController } from "../../src/ui/hooks/useCommandPalette.js";

test("command palette opens and executes its selected command", () => {
  const palette = new CommandPaletteController();
  let executed = false;
  palette.registerCommand({ id: "go", label: "Open Go Agent", action() { executed = true; } });
  palette.open();
  assert.equal(palette.isOpen, true);
  palette.executeSelected();
  assert.equal(executed, true);
  assert.equal(palette.isOpen, false);
});
