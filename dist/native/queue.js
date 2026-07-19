import { NativeQueue } from "./bridge.js";
export const offlineOperationTypes = ["mail_send", "mail_archive", "calendar_create", "docs_update", "connector_sync"];
export class OfflineQueue {
    queue;
    replay;
    constructor(queue = new NativeQueue(), replay) {
        this.queue = queue;
        this.replay = replay;
    }
    enqueue(type, payload) {
        return this.fromNative(this.queue.enqueue(type, JSON.stringify(payload)));
    }
    dequeue() {
        const operation = this.queue.dequeue();
        return operation ? this.fromNative(operation) : undefined;
    }
    markCompleted(id) { this.queue.markCompleted(id); }
    markFailed(id, error) { this.queue.markFailed(id, error); }
    retry(id) { this.queue.retry(id); }
    pendingCount() { return this.queue.pendingCount(); }
    async sync() {
        if (!this.replay)
            return 0;
        let completed = 0;
        for (;;) {
            const operation = this.dequeue();
            if (!operation)
                return completed;
            try {
                await this.replay(operation);
                this.markCompleted(operation.id);
                completed += 1;
            }
            catch (error) {
                this.markFailed(operation.id, error instanceof Error ? error.message : "Offline operation replay failed");
            }
        }
    }
    fromNative(operation) {
        if (!offlineOperationTypes.includes(operation.type))
            throw new Error(`Unsupported offline operation type: ${operation.type}`);
        return { ...operation, type: operation.type, payload: JSON.parse(operation.payload) };
    }
}
//# sourceMappingURL=queue.js.map