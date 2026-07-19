import { NativeNotifications } from "./bridge.js";

export interface NotificationOptions {
  iconPath?: string;
}

export type DurableRunNotificationEvent = "approval-needed" | "complete" | "failed";

interface ScheduledNotification {
  timeout: ReturnType<typeof setTimeout>;
}

export class NotificationService {
  private readonly nativeNotifications: NativeNotifications;
  private nextId = 1;
  private readonly scheduled = new Map<string, ScheduledNotification>();

  constructor(nativeNotifications = new NativeNotifications()) {
    this.nativeNotifications = nativeNotifications;
  }

  show(title: string, body: string, _options: NotificationOptions = {}): string {
    const id = `notification-${this.nextId++}`;
    this.nativeNotifications.show(title, body);
    return id;
  }

  scheduleReminder(title: string, body: string, when: Date): string {
    const id = `notification-${this.nextId++}`;
    const delay = Math.max(0, when.getTime() - Date.now());
    const timeout = setTimeout(() => {
      this.scheduled.delete(id);
      this.nativeNotifications.show(title, body);
    }, delay);
    this.scheduled.set(id, { timeout });
    return id;
  }

  dismiss(id: string): void {
    const reminder = this.scheduled.get(id);
    if (!reminder) return;
    clearTimeout(reminder.timeout);
    this.scheduled.delete(id);
  }

  notifyDurableRun(event: DurableRunNotificationEvent, runId: string): string {
    switch (event) {
      case "approval-needed":
        return this.show("Approval needed", `Durable run ${runId} requires approval.`);
      case "complete":
        return this.show("Run complete", `Durable run ${runId} completed.`);
      case "failed":
        return this.show("Run failed", `Durable run ${runId} failed.`);
    }
  }
}
