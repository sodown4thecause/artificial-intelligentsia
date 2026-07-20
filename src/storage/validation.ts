import type { MalwareScanResult } from "./types.js";

export const DEFAULT_ALLOWED_CONTENT_TYPES = new Set([
  "application/json",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/markdown",
  "text/plain",
]);

export function normalizeContentType(contentType: string): string {
  const normalized = contentType.trim().toLowerCase();
  if (!normalized || normalized.includes(";") || !/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/.test(normalized)) {
    throw new Error("Invalid content type");
  }
  return normalized;
}

export function assertAllowedContentType(
  contentType: string,
  allowedContentTypes: ReadonlySet<string> = DEFAULT_ALLOWED_CONTENT_TYPES,
): string {
  const normalized = normalizeContentType(contentType);
  if (!allowedContentTypes.has(normalized)) {
    throw new Error(`Unsupported content type: ${normalized}`);
  }
  return normalized;
}

/**
 * Phase 0 has no malware engine. This explicit result keeps callers from
 * treating an upload as scanned while preserving the future scanner boundary.
 */
export async function scanForMalware(_content: Uint8Array, _contentType: string): Promise<MalwareScanResult> {
  return { status: "not-scanned", detail: "Malware scanning is not configured in Phase 0" };
}
