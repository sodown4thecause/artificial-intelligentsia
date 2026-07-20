import assert from "node:assert/strict";
import test from "node:test";
import { canAccessSearchPolicy } from "../../src/search/authz.js";
import { groundSearchResults } from "../../src/search/grounding.js";
import { InMemorySearchIndex } from "../../src/search/index.js";
import type { SearchDocument, SearchPrincipal } from "../../src/search/types.js";

const alice: SearchPrincipal = { userId: "alice", workspaceId: "workspace-a", groupIds: ["product"], scopes: ["docs:read"] };
const bob: SearchPrincipal = { userId: "bob", workspaceId: "workspace-a", groupIds: ["engineering"], scopes: ["docs:read"] };

function document(overrides: Partial<SearchDocument> = {}): SearchDocument {
  return {
    id: "roadmap",
    title: "Q3 product roadmap",
    content: "Creature OS will ship permission-aware search in Q3.",
    source: { id: "doc-123", uri: "creature://documents/doc-123", title: "Q3 product roadmap" },
    access: { workspaceId: "workspace-a", allowedGroupIds: ["product"], requiredScopes: ["docs:read"] },
    updatedAt: new Date("2026-07-20T00:00:00.000Z"),
    ...overrides,
  };
}

test("search returns only documents permitted for the principal", () => {
  const index = new InMemorySearchIndex();
  index.index(document());
  index.index(document({ id: "engineering", access: { workspaceId: "workspace-a", allowedGroupIds: ["engineering"] } }));

  assert.deepEqual(index.search({ text: "permission-aware" }, alice).map((result) => result.document.id), ["roadmap"]);
  assert.deepEqual(index.search({ text: "permission-aware" }, bob).map((result) => result.document.id), ["engineering"]);
  assert.equal(canAccessSearchPolicy(document().access, { ...alice, workspaceId: "workspace-b" }), false);
});

test("index rejects documents that contain secrets", () => {
  const index = new InMemorySearchIndex();
  assert.throws(
    () => index.index(document({ content: "api_key=super-secret-value" })),
    /must not be indexed/,
  );
  assert.deepEqual(index.search({ text: "secret" }, alice), []);
});

test("grounded answers retain the canonical source for every claim", () => {
  const index = new InMemorySearchIndex();
  index.index(document());
  const answer = groundSearchResults(index.search({ text: "permission-aware" }, alice));

  assert.equal(answer.claims.length, 1);
  assert.equal(answer.claims[0]?.source.uri, "creature://documents/doc-123");
  assert.equal(answer.claims[0]?.documentId, "roadmap");
  assert.match(answer.text, /permission-aware search/i);
});
