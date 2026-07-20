import { filterPermittedDocuments } from "./authz.js";
import type { SearchDocument, SearchIndex, SearchPrincipal, SearchQuery, SearchResult } from "./types.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SECRET_PATTERNS = [
  /(?:api[_-]?key|secret|password|token)\s*[:=]\s*[^\s]+/i,
  /(?:sk|pk)_[a-z0-9]{16,}/i,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/,
];

/**
 * Deliberately small, process-local index for Phase 0. It evaluates permissions
 * before scoring, so unauthorized documents cannot affect returned results.
 */
export class InMemorySearchIndex implements SearchIndex {
  private readonly documents = new Map<string, SearchDocument>();

  index(document: SearchDocument): void {
    assertIndexable(document);
    this.documents.set(document.id, cloneDocument(document));
  }

  remove(documentId: string): boolean {
    return this.documents.delete(documentId);
  }

  search(query: SearchQuery, principal: SearchPrincipal): SearchResult[] {
    const terms = tokenize(query.text);
    if (terms.length === 0) return [];

    const limit = normalizeLimit(query.limit);
    return filterPermittedDocuments(this.documents.values(), principal)
      .map((document) => scoreDocument(document, terms))
      .filter((result): result is SearchResult => result !== undefined)
      .sort((left, right) => right.score - left.score || right.document.updatedAt.getTime() - left.document.updatedAt.getTime())
      .slice(0, limit);
  }
}

function assertIndexable(document: SearchDocument): void {
  if (!document.id.trim()) throw new Error("Search document id is required.");
  if (!document.access.workspaceId.trim()) throw new Error("Search document workspaceId is required.");
  if (!document.source.uri.trim()) throw new Error("Search document canonical source URI is required.");
  if (containsSecret(document.title) || containsSecret(document.content)) {
    throw new Error("Search documents containing secrets must not be indexed.");
  }
}

function containsSecret(value: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

function tokenize(value: string): string[] {
  return Array.from(new Set(value.toLocaleLowerCase().match(/[\p{L}\p{N}_-]+/gu) ?? []));
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1) throw new Error("Search query limit must be a positive integer.");
  return Math.min(limit, MAX_LIMIT);
}

function scoreDocument(document: SearchDocument, terms: readonly string[]): SearchResult | undefined {
  const title = document.title.toLocaleLowerCase();
  const content = document.content.toLocaleLowerCase();
  let score = 0;
  let firstMatch = -1;

  for (const term of terms) {
    const titleMatches = countOccurrences(title, term);
    const contentMatches = countOccurrences(content, term);
    if (titleMatches + contentMatches === 0) continue;
    score += titleMatches * 3 + contentMatches;
    const contentMatch = content.indexOf(term);
    if (firstMatch === -1 || (contentMatch !== -1 && contentMatch < firstMatch)) firstMatch = contentMatch;
  }

  if (score === 0) return undefined;
  return { document: cloneDocument(document), score, excerpt: excerptAt(document.content, firstMatch) };
}

function countOccurrences(value: string, term: string): number {
  return value.split(term).length - 1;
}

function excerptAt(content: string, matchIndex: number): string {
  if (matchIndex < 0) return content.slice(0, 160);
  const start = Math.max(0, matchIndex - 60);
  const end = Math.min(content.length, matchIndex + 100);
  return `${start > 0 ? "…" : ""}${content.slice(start, end)}${end < content.length ? "…" : ""}`;
}

function cloneDocument(document: SearchDocument): SearchDocument {
  return {
    ...document,
    updatedAt: new Date(document.updatedAt),
    source: { ...document.source },
    access: {
      ...document.access,
      allowedUserIds: document.access.allowedUserIds ? [...document.access.allowedUserIds] : undefined,
      allowedGroupIds: document.access.allowedGroupIds ? [...document.access.allowedGroupIds] : undefined,
      requiredScopes: document.access.requiredScopes ? [...document.access.requiredScopes] : undefined,
    },
  };
}
