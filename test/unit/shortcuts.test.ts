import assert from "node:assert/strict";
import test from "node:test";
import { ShortcutService, ShortcutModifiers } from "../../src/native/shortcuts.js";
import { filterCommands, CommandPaletteController } from "../../src/ui/hooks/useCommandPalette.js";

class ShortcutTarget {
  listener: ((event: { key: string; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; metaKey: boolean; preventDefault(): void }) => void) | undefined;
  addEventListener(_type: "keydown", listener: (event: { key: string; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; metaKey: boolean; preventDefault(): void }) => void): void { this.listener = listener; }
  removeEventListener(): void { this.listener = undefined; }
}

test("shortcut service registers, invokes, and unregisters local shortcuts", () => {
  const target = new ShortcutTarget();
  const shortcuts = new ShortcutService(target);
  let invoked = 0;
  shortcuts.register(ShortcutModifiers.Control, "k", "palette", () => { invoked += 1; });
  target.listener?.({ key: "k", ctrlKey: true, shiftKey: false, altKey: false, metaKey: false, preventDefault() {} });
  assert.equal(invoked, 1);
  assert.equal(shortcuts.unregister("palette"), true);
  assert.equal(target.listener, undefined);
});

test("command palette registers commands and filters them", () => {
  const palette = new CommandPaletteController();
  const remove = palette.registerCommand({ id: "mail", label: "Open Mail", action() {} });
  palette.registerCommand({ id: "docs", label: "Open Docs", action() {} });
  palette.setQuery("mail");
  assert.deepEqual(palette.filteredCommands.map((command) => command.id), ["mail"]);
  remove();
  assert.equal(palette.commands.length, 1);
});
