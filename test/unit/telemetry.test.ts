import assert from "node:assert/strict";
import test from "node:test";
import { createTelemetryEmitter } from "../../src/telemetry/events.js";
import { InMemoryTelemetrySink, createPrivacySafeSink } from "../../src/telemetry/sink.js";

test("emits all required operational and outcome signals", () => {
  const sink = new InMemoryTelemetrySink();
  const telemetry = createTelemetryEmitter(sink, () => new Date("2026-07-20T00:00:00.000Z"));
  telemetry.agentRunLatency({ runId: "run-1", agentId: "writer", agentVersion: "1", durationMs: 12, outcome: "success" });
  telemetry.modelLatency({ model: "model-a", durationMs: 4, outcome: "success" });
  telemetry.toolLatency({ toolName: "mail.search", durationMs: 3, outcome: "success" });
  telemetry.connectorLatency({ connector: "gmail", operation: "search", durationMs: 3, outcome: "success" });
  telemetry.approvalWait({ runId: "run-1", durationMs: 5, decision: "approved", actionClass: "consequential" });
  telemetry.retry({ runId: "run-1", attempt: 2, operation: "tool", recovered: true });
  telemetry.suggestionAcceptance({ suggestionCategory: "grammar", accepted: true });
  telemetry.automationCompletion({ automationId: "auto-1", mode: "dry-run", outcome: "success", durationMs: 9 });
  telemetry.undo({ surface: "docs" }); telemetry.correction({ surface: "writing" });
  telemetry.memoryRetrieval({ resultCount: 2, scope: "personal" }); telemetry.memoryCorrection({ action: "corrected", scope: "personal" });
  assert.deepEqual(sink.events.map(({ name }) => name), ["agent.run.latency", "model.latency", "tool.latency", "connector.latency", "approval.wait", "agent.retry", "suggestion.accepted", "automation.completed", "agent.undo", "agent.correction", "memory.retrieved", "memory.corrected"]);
  assert.equal(sink.events[0]?.occurredAt, "2026-07-20T00:00:00.000Z");
});

test("redacts secrets in telemetry attributes and protected keys before persistence", () => {
  let stored = "";
  const sink = createPrivacySafeSink((event) => { stored = JSON.stringify(event); });
  sink.persist({ name: "tool.latency", schemaVersion: "1.0", occurredAt: "2026-07-20T00:00:00.000Z", attributes: { detail: "Authorization: Bearer FAKE_BEARER_TOKEN_abcdefghijklmnopqrstuvwxyz123456", access_token: "top-secret" } });
  assert.match(stored, /\[REDACTED\]/);
  assert.doesNotMatch(stored, /FAKE_BEARER_TOKEN|top-secret/);
});
