import assert from "node:assert/strict";
import test from "node:test";
import { applySuggestions } from "../../src/rewrites/apply.js";
import { RewriteEngine } from "../../src/rewrites/engine.js";
import { detectProtectedRanges } from "../../src/rewrites/protected.js";
import { DocumentRepository } from "../../src/documents/repository.js";

const actor = { userId: "user-1", workspaceId: "workspace-1" };
const repository = () => new DocumentRepository(
  { canAccess: async () => true },
  { index: () => undefined, remove: () => true, search: () => [] },
  { write: async () => undefined },
);

async function documentWithText(text: string) {
  return repository().create(actor, { workspaceId: actor.workspaceId, title: "Rewrite test", content: { blocks: [{ type: "paragraph", text }] } });
}

test("detects names, numbers, citations, links, terminology, and user selections", async () => {
  const content = { blocks: [{ type: "paragraph" as const, text: "Jane Doe cited [1] at https://example.test for 42 AcmeTerm." }] };
  const ranges = detectProtectedRanges(content, ["AcmeTerm"]);
  assert.deepEqual(new Set(ranges.map((range) => range.kind)), new Set(["name", "number", "citation", "link", "terminology"]));
});

test("engine preserves protected content and builds suggestions tied to the base version", async () => {
  const document = await documentWithText("Jane Doe has 42 open tasks.");
  const engine = new RewriteEngine(async (request) => ({ suggestions: [{
    id: "suggestion-1", documentId: request.documentId, baseVersion: request.baseVersion, blockIndex: 0,
    originalText: "Jane Doe has 42 open tasks.", suggestedText: "Jane Doe has 42 outstanding tasks.",
    protectedRanges: [], reason: "Improves clarity", tone: "correctness", status: "pending",
  }] }));
  const suggestions = await engine.generate({ document, instructions: "Correct grammar", tone: "correctness" });
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0]?.status, "pending");
  assert.equal(suggestions[0]?.protectedRanges.length, 2);
});

test("engine rejects suggestions that change protected content or contain secrets", async () => {
  const document = await documentWithText("Jane Doe has 42 open tasks.");
  const changedName = new RewriteEngine(async (request) => ({ suggestions: [{
    id: "suggestion-name", documentId: request.documentId, baseVersion: request.baseVersion, blockIndex: 0,
    originalText: "Jane Doe has 42 open tasks.", suggestedText: "John Doe has 42 open tasks.", protectedRanges: [], reason: "", tone: "correctness", status: "pending",
  }] }));
  await assert.rejects(changedName.generate({ document, instructions: "", tone: "correctness" }), /protected content/);
  const secret = new RewriteEngine(async (request) => ({ suggestions: [{
    id: "suggestion-secret", documentId: request.documentId, baseVersion: request.baseVersion, blockIndex: 0,
    originalText: "Jane Doe has 42 open tasks.", suggestedText: "token=super-secret-value", protectedRanges: [], reason: "", tone: "correctness", status: "pending",
  }] }));
  await assert.rejects(secret.generate({ document, instructions: "", tone: "correctness" }), /secret-like/);
});

test("applying accepted suggestions rejects stale document versions", async () => {
  const repo = repository();
  const document = await repo.create(actor, { workspaceId: actor.workspaceId, title: "Rewrite test", content: { blocks: [{ type: "paragraph", text: "Draft text" }] } });
  const suggestion = { id: "suggestion-stale", documentId: document.id, baseVersion: document.currentVersion, blockIndex: 0, originalText: "Draft text", suggestedText: "Revised text", protectedRanges: [], reason: "", tone: "correctness" as const, status: "accepted" as const };
  await repo.save(actor, document.id, { title: document.title, content: document.content, expectedVersion: document.currentVersion, changeSummary: "Concurrent update" });
  await assert.rejects(applySuggestions({ repository: repo, actor, documentId: document.id, permissionCheck: async () => "preview-required" }, [suggestion], document.currentVersion), /stale/);
});
