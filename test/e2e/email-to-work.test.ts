import assert from "node:assert/strict";
import test from "node:test";

type Citation = { sourceId: string; excerpt: string };
type TelemetryEvent = { name: string; attributes: Record<string, string> };

class EmailToWorkFixture {
  readonly telemetry: TelemetryEvent[] = [];
  readonly memory: string[] = [];
  private readonly research = new Map<string, { body: string; citations: Citation[] }>();

  researchRequest(requestId: string, request: string): string {
    const researchId = `research:${requestId}`;
    this.research.set(researchId, {
      body: `Research for ${request}`,
      citations: [{ sourceId: "mail:request-1", excerpt: request }],
    });
    this.telemetry.push({ name: "research.persisted", attributes: { researchId } });
    return researchId;
  }

  createSupportingDocument(researchId: string): { id: string; citations: Citation[] } {
    const research = this.research.get(researchId);
    if (!research) throw new Error("Durable research is required before creating a supporting document");
    const document = { id: `document:${researchId}`, citations: research.citations };
    this.telemetry.push({ name: "supporting_document.created", attributes: { documentId: document.id } });
    return document;
  }

  draftReply(document: { id: string; citations: Citation[] }): { id: string; citations: Citation[]; approved: false } {
    if (document.citations.length === 0) throw new Error("A reply draft requires citations");
    this.telemetry.push({ name: "reply.drafted", attributes: { documentId: document.id } });
    return { id: `draft:${document.id}`, citations: document.citations, approved: false };
  }

  approve(draft: { id: string; citations: Citation[]; approved: false }): { id: string; citations: Citation[]; approved: true } {
    this.telemetry.push({ name: "approval.granted", attributes: { draftId: draft.id } });
    return { ...draft, approved: true };
  }

  remember(summary: string, enabled: boolean): void {
    if (enabled) this.memory.push(summary);
    this.telemetry.push({ name: "memory.decision", attributes: { enabled: String(enabled) } });
  }
}

test("email request produces durable cited work, an approval-gated reply, and optional memory", () => {
  const workspace = new EmailToWorkFixture();
  const researchId = workspace.researchRequest("renewal", "Customer requests renewal terms");
  const document = workspace.createSupportingDocument(researchId);
  const draft = workspace.draftReply(document);

  assert.equal(document.id, "document:research:renewal");
  assert.deepEqual(draft.citations, [{ sourceId: "mail:request-1", excerpt: "Customer requests renewal terms" }]);
  assert.equal(draft.approved, false);
  const approved = workspace.approve(draft);
  assert.equal(approved.approved, true);

  workspace.remember("Customer renewal preference", false);
  assert.deepEqual(workspace.memory, []);
  workspace.remember("Customer renewal preference", true);
  assert.deepEqual(workspace.memory, ["Customer renewal preference"]);
  assert.deepEqual(workspace.telemetry.map((event) => event.name), [
    "research.persisted", "supporting_document.created", "reply.drafted", "approval.granted", "memory.decision", "memory.decision",
  ]);
});
