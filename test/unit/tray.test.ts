import assert from "node:assert/strict";
import test from "node:test";
import { TrayService } from "../../src/native/tray.js";

test("tray service can be instantiated", () => {
  const tray = new TrayService();
  assert.equal(tray.getTooltip(), "Creature OS");
  assert.equal(tray.getMenuItems().length, 4);
});

test("tray menu items can be added", () => {
  const tray = new TrayService();
  tray.addMenuItem("Refresh", () => {});
  assert.equal(tray.getMenuItems().at(-1)?.label, "Refresh");
});

test("tray tooltip can be set", () => {
  const tray = new TrayService();
  tray.setTooltip("2 pending approvals");
  assert.equal(tray.getTooltip(), "2 pending approvals");
});
