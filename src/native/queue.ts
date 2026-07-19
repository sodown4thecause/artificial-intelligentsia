import { NativeQueue, type NativeQueueOperation } from "./bridge.js";

export const offlineOperationTypes = ["mail_send", "mail_archive", "calendar_create", "docs_update", "connector_sync"] as const;
export type OfflineOperationType = (typeof offlineOperationTypes)[number];
export type OfflineOperation = Omit<NativeQueueOperation, "payload" | "type"> & { type: OfflineOperationType; payload: unknown };
export type OperationReplayer = (operation: OfflineOperation) => Promise<void>;

export class OfflineQueue {
  constructor(private readonly queue = new NativeQueue(), private readonly replay?: OperationReplayer) {}

  enqueue(type: OfflineOperationType, payload: unknown): OfflineOperation {
    return this.fromNative(this.queue.enqueue(type, JSON.stringify(payload)));
  }

  dequeue(): OfflineOperation | undefined {
    const operation = this.queue.dequeue();
    return operation ? this.fromNative(operation) : undefined;
  }

  markCompleted(id: string): void { this.queue.markCompleted(id); }
  markFailed(id: string, error: string): void { this.queue.markFailed(id, error); }
  retry(id: string): void { this.queue.retry(id); }
  pendingCount(): number { return this.queue.pendingCount(); }

  async sync(): Promise<number> {
    if (!this.replay) return 0;
    let completed = 0;
    for (;;) {
      const operation = this.dequeue();
      if (!operation) return completed;
      try {
        await this.replay(operation);
        this.markCompleted(operation.id);
        completed += 1;
      } catch (error) {
        this.markFailed(operation.id, error instanceof Error ? error.message : "Offline operation replay failed");
      }
    }
  }

  private fromNative(operation: NativeQueueOperation): OfflineOperation {
    if (!offlineOperationTypes.includes(operation.type as OfflineOperationType)) throw new Error(`Unsupported offline operation type: ${operation.type}`);
    return { ...operation, type: operation.type as OfflineOperationType, payload: JSON.parse(operation.payload) };
  }
}
