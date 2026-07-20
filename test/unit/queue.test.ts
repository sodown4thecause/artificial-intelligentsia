import assert from "node:assert/strict";
import test from "node:test";
import { OfflineQueue } from "../../src/native/queue.js";

test("enqueues and dequeues an operation", () => {
  const queue = new OfflineQueue();
  const enqueued = queue.enqueue("mail_send", { to: "person@example.test" });
  assert.equal(queue.pendingCount(), 1);
  assert.deepEqual(queue.dequeue(), { ...enqueued, status: "processing" });
});

test("marks operations completed and failed", () => {
  const queue = new OfflineQueue();
  const completed = queue.enqueue("mail_archive", { id: "mail-1" });
  queue.dequeue();
  queue.markCompleted(completed.id);
  assert.equal(queue.pendingCount(), 0);

  const failed = queue.enqueue("docs_update", { id: "doc-1" });
  queue.dequeue();
  queue.markFailed(failed.id, "offline");
  assert.equal(queue.pendingCount(), 0);
});

test("retries failed operations", () => {
  const queue = new OfflineQueue();
  const operation = queue.enqueue("connector_sync", { connector: "mail" });
  queue.dequeue();
  queue.markFailed(operation.id, "temporary failure");
  queue.retry(operation.id);
  assert.equal(queue.pendingCount(), 1);
  assert.equal(queue.dequeue()?.retry_count, 1);
});

test("sync replays pending operations", async () => {
  const replayed: string[] = [];
  const queue = new OfflineQueue(undefined, async (operation) => { replayed.push(operation.id); });
  const operation = queue.enqueue("calendar_create", { title: "Planning" });
  assert.equal(await queue.sync(), 1);
  assert.deepEqual(replayed, [operation.id]);
});
