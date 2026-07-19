import assert from "node:assert/strict";
import test from "node:test";
import { NotificationService } from "../../src/native/notifications.js";

test("notification can be shown", () => {
  const notifications = new NotificationService();
  assert.equal(notifications.show("Hello", "Creature is ready"), "notification-1");
});

test("reminder can be scheduled", () => {
  const notifications = new NotificationService();
  const id = notifications.scheduleReminder("Reminder", "Review approvals", new Date(Date.now() + 60_000));
  assert.equal(id, "notification-1");
  notifications.dismiss(id);
});

test("scheduled reminder can be dismissed", () => {
  const notifications = new NotificationService();
  const id = notifications.scheduleReminder("Reminder", "Review approvals", new Date(Date.now() + 60_000));
  notifications.dismiss(id);
  notifications.dismiss(id);
  assert.ok(true);
});

test("durable run events create notifications", () => {
  const notifications = new NotificationService();
  assert.equal(notifications.notifyDurableRun("approval-needed", "run-42"), "notification-1");
  assert.equal(notifications.notifyDurableRun("complete", "run-42"), "notification-2");
  assert.equal(notifications.notifyDurableRun("failed", "run-42"), "notification-3");
});
