export interface MemoryCandidate {
  value: string;
  sourceId: string;
  requiresApproval: true;
}

const secretPattern = /(?:api[_ -]?key|access[_ -]?token|password|private[_ -]?key)\s*[:=]/i;

/** Creates an explicit memory candidate only when it does not resemble a secret. */
export const createMemoryCandidate = (value: string, sourceId: string): MemoryCandidate | undefined =>
  secretPattern.test(value) ? undefined : { value, sourceId, requiresApproval: true };
