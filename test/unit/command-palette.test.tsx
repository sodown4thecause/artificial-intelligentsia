import { test } from "node:test";
import assert from "node:assert/strict";
import { filterCommands, CommandPaletteController } from "../../src/ui/hooks/useCommandPalette.js";

test("command palette filters commands by query", () => {
  const palette = new CommandPaletteController([
    { id: "go", label: "Open Go Agent", action: () => {} },
    { id: "mail", label: "Open Mail", action: () => {} },
  ]);

  palette.setQuery("mail");
  assert.equal(palette.filteredCommands.length, 1);
  assert.equal(palette.filteredCommands[0].id, "mail");
});

test("command palette registers and unregisters commands", () => {
  const palette = new CommandPaletteController();
  palette.registerCommand({ id: "docs", label: "Open Docs", action: () => {} });
  assert.equal(palette.commands.length, 1);
  palette.unregisterCommand("docs");
  assert.equal(palette.commands.length, 0);
});

test("command palette selection wraps around", () => {
  const palette = new CommandPaletteController([
    { id: "a", label: "A", action: () => {} },
    { id: "b", label: "B", action: () => {} },
  ]);

  palette.selectNext();
  assert.equal(palette.selectedIndex, 1);
  palette.selectNext();
  assert.equal(palette.selectedIndex, 0);
  palette.selectPrevious();
  assert.equal(palette.selectedIndex, 1);
});
