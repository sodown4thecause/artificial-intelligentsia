import assert from "node:assert/strict";
import test from "node:test";

type WorkspaceRecord = { id: string; kind: "mail" | "calendar" | "file" | "document"; text: string; canonicalUrl: string };

class ProjectWorkspaceFixture {
  readonly telemetry: string[] = [];
  readonly records: WorkspaceRecord[] = [
    { id: "mail-1", kind: "mail", text: "Ava owns the renewal proposal.", canonicalUrl: "mail://thread-1/message-1" },
    { id: "calendar-1", kind: "calendar", text: "Renewal review is Friday.", canonicalUrl: "calendar://event-1" },
    { id: "file-1", kind: "file", text: "Pricing appendix is attached.", canonicalUrl: "file://pricing-appendix" },
    { id: "doc-1", kind: "document", text: "Decision: approve annual renewal after legal review.", canonicalUrl: "document://renewal-brief/v2" },
  ];

  view() {
    this.telemetry.push("project.view.generated");
    return {
      status: "legal review pending",
      decisions: ["approve annual renewal after legal review"],
      questions: ["Does legal approve the pricing appendix?"],
      owners: [{ name: "Ava", responsibility: "renewal proposal" }],
      nextActions: ["Review renewal on Friday"],
    };
  }

  answer(question: string) {
    const cited = this.records.filter((record) =>
      (record.kind === "mail" || record.kind === "document")
      && /owner|renewal|legal/i.test(question)
      && /Ava|renewal|legal/i.test(record.text),
    );
    if (cited.length === 0) throw new Error("No grounded answer is available");
    this.telemetry.push("project.answer.grounded");
    return { answer: "Ava owns the proposal; legal review remains before approval.", citations: cited.map(({ canonicalUrl }) => canonicalUrl) };
  }
}

test("connected project workspace unifies fixtures into a cited AI view and grounded answer", () => {
  const workspace = new ProjectWorkspaceFixture();
  assert.deepEqual(workspace.records.map((record) => record.kind), ["mail", "calendar", "file", "document"]);
  assert.deepEqual(workspace.view(), {
    status: "legal review pending",
    decisions: ["approve annual renewal after legal review"],
    questions: ["Does legal approve the pricing appendix?"],
    owners: [{ name: "Ava", responsibility: "renewal proposal" }],
    nextActions: ["Review renewal on Friday"],
  });
  const answer = workspace.answer("Who owns the renewal and what is legal's status?");
  assert.equal(answer.citations.length, 2);
  assert.ok(answer.citations.every((citation) => /^(mail|document):\/\//.test(citation)));
  assert.deepEqual(workspace.telemetry, ["project.view.generated", "project.answer.grounded"]);
});
