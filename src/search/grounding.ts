import type { GroundedAnswer, GroundedClaim, SearchResult } from "./types.js";

/**
 * Produces a displayable answer whose every claim is explicitly linked to the
 * canonical source from the permitted search result that supports it.
 */
export function groundSearchResults(results: readonly SearchResult[]): GroundedAnswer {
  const claims = results.map(toGroundedClaim);
  return {
    text: claims.map((claim) => claim.text).join("\n"),
    claims,
  };
}

/** Converts a result excerpt into a claim with its immutable source reference. */
export function toGroundedClaim(result: SearchResult): GroundedClaim {
  return {
    text: result.excerpt,
    documentId: result.document.id,
    source: { ...result.document.source },
  };
}
