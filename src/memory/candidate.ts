import { containsSecret, redactSecrets } from "../core/redaction/secrets.js";
import {
  MEMORY_TYPES,
  type MemoryCandidate,
  type MemoryCandidateStatus,
  type MemoryProvenance,
  type MemoryScope,
  type MemoryType,
} from "./types.js";

export interface CandidateProposal {
  type: MemoryType;
  content: string;
  provenance?: MemoryProvenance;
}

export interface AgentMemoryOutput {
  output: string;
  scope: MemoryScope;
  proposals?: readonly CandidateProposal[];
  createdAt?: string;
}

export interface CandidateApproval {
  approved: boolean;
  reason?: string;
}

/**
 * The product integration point for policy and explicit user consent. It is
 * deliberately fail-closed until a caller supplies an approval decision.
 */
export class UserPolicyApprovalGate {
  request(candidate: MemoryCandidate): MemoryCandidate {
    return { ...candidate, status: "pending-approval" };
  }

  decide(candidate: MemoryCandidate, approval: CandidateApproval): MemoryCandidate {
    if (candidate.status === "rejected-sensitive") {
      return candidate;
    }

    return {
      ...candidate,
      status: approval.approved ? "approved" : "rejected-policy",
      reason: approval.approved ? undefined : approval.reason ?? "User or policy approval was not granted.",
    };
  }
}

/** Extracts only explicitly marked or structured memory proposals from agent output. */
export function extractMemoryCandidates(input: AgentMemoryOutput): MemoryCandidate[] {
  const proposals = input.proposals ?? parseExplicitProposals(input.output);
  const createdAt = input.createdAt ?? new Date().toISOString();

  return proposals.map((proposal, index) =>
    createMemoryCandidate({
      id: `candidate-${createdAt}-${index}`,
      type: proposal.type,
      content: proposal.content,
      scope: input.scope,
      provenance: proposal.provenance ?? { kind: "agent-output" },
      createdAt,
    }),
  );
}

export function createMemoryCandidate(candidate: Omit<MemoryCandidate, "status" | "reason">): MemoryCandidate {
  const sensitive = containsSecret(candidate.content) || containsSecret(candidate.provenance.reference ?? "");
  if (sensitive) {
    return {
      ...candidate,
      content: redactSecrets(candidate.content),
      provenance: {
        ...candidate.provenance,
        reference: candidate.provenance.reference ? redactSecrets(candidate.provenance.reference) : undefined,
      },
      status: "rejected-sensitive",
      reason: "Sensitive content, credentials, or authentication material cannot be stored in memory.",
    };
  }

  return { ...candidate, status: "pending-approval" };
}

function parseExplicitProposals(output: string): CandidateProposal[] {
  const proposals: CandidateProposal[] = [];
  const expression = /^MEMORY\[([^\]]+)\]:\s*(.+)$/gim;
  let match: RegExpExecArray | null;

  while ((match = expression.exec(output)) !== null) {
    const type = match[1].trim() as MemoryType;
    if (MEMORY_TYPES.includes(type)) {
      proposals.push({ type, content: match[2].trim() });
    }
  }

  return proposals;
}

export function isApprovedCandidate(candidate: MemoryCandidate): candidate is MemoryCandidate & { status: "approved" } {
  return candidate.status === ("approved" satisfies MemoryCandidateStatus);
}
