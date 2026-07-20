/** A stable, canonical location for material returned by search. */
export interface CanonicalSource {
  id: string;
  /** URI rather than a display URL so native and connector sources are supported. */
  uri: string;
  title: string;
}

/** The visibility boundary that must be evaluated before a document is returned. */
export interface SearchAccessPolicy {
  workspaceId: string;
  ownerId?: string;
  allowedUserIds?: readonly string[];
  allowedGroupIds?: readonly string[];
  requiredScopes?: readonly string[];
}

/** Content eligible for the Phase 0 in-memory index. Content must never contain secrets. */
export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  source: CanonicalSource;
  access: SearchAccessPolicy;
  updatedAt: Date;
}

/** The identity and grants used to evaluate visibility. */
export interface SearchPrincipal {
  userId: string;
  workspaceId: string;
  groupIds?: readonly string[];
  scopes?: readonly string[];
}

export interface SearchQuery {
  text: string;
  limit?: number;
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  /** A short source excerpt containing a matching term. */
  excerpt: string;
}

export interface GroundedClaim {
  text: string;
  source: CanonicalSource;
  documentId: string;
}

export interface GroundedAnswer {
  text: string;
  claims: readonly GroundedClaim[];
}

export interface SearchIndex {
  index(document: SearchDocument): void;
  remove(documentId: string): boolean;
  search(query: SearchQuery, principal: SearchPrincipal): SearchResult[];
}
