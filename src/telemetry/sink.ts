import { redactSecrets } from "../core/redaction/secrets.js";
import type { TelemetryEvent, TelemetrySink, TelemetryValue } from "./types.js";

const SECRET_KEY = /(?:api[-_]?key|authorization|credential|cookie|pass(?:word)?|secret|token|private[-_]?key)/i;
const REDACTED_VALUE = "[REDACTED]";

function sanitizeValue(value: unknown, seen: WeakSet<object>): TelemetryValue | undefined {
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return redactSecrets(value);
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Error) return redactSecrets(value.message);
  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) return "[CIRCULAR]";
    seen.add(value);
    return redactSecrets(JSON.stringify(value, (key, nestedValue) => (
      SECRET_KEY.test(key) ? REDACTED_VALUE : nestedValue
    )));
  }
  return undefined;
}

/** Redacts values and protected field names immediately before data leaves the process. */
export function sanitizeTelemetryEvent(event: TelemetryEvent): TelemetryEvent {
  const seen = new WeakSet<object>();
  const attributes: TelemetryEvent["attributes"] = {};
  for (const [key, value] of Object.entries(event.attributes)) {
    attributes[key] = SECRET_KEY.test(key) ? REDACTED_VALUE : sanitizeValue(value, seen);
  }

  return {
    ...event,
    runId: event.runId ? redactSecrets(event.runId) : undefined,
    workspaceId: event.workspaceId ? redactSecrets(event.workspaceId) : undefined,
    attributes,
  };
}

export function createPrivacySafeSink(persist: (event: TelemetryEvent) => void | Promise<void>): TelemetrySink {
  return { persist: (event) => persist(sanitizeTelemetryEvent(event)) };
}

/** Useful for local development and deterministic tests; stores only sanitized events. */
export class InMemoryTelemetrySink implements TelemetrySink {
  readonly events: TelemetryEvent[] = [];

  persist(event: TelemetryEvent): void {
    this.events.push(sanitizeTelemetryEvent(event));
  }
}
