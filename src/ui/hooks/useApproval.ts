import { useCallback, useState } from "react";

import type { ApprovalGate } from "../../approvals/gate.js";
import type { ApprovalRequest } from "../../approvals/types.js";

export function useApproval(gate: ApprovalGate | undefined, requestId: string | undefined) {
  const [request, setRequest] = useState<ApprovalRequest | undefined>(() => requestId === undefined ? undefined : gate?.get(requestId));
  const decide = useCallback((decision: "approve" | "deny" | "revoke", actor: string, reason?: string) => {
    if (gate === undefined || requestId === undefined) throw new Error("Approval request is unavailable.");
    const updated = decision === "approve" ? gate.approve(requestId, actor, reason) : decision === "deny" ? gate.deny(requestId, actor, reason) : gate.revoke(requestId, actor, reason);
    setRequest(updated);
    return updated;
  }, [gate, requestId]);
  return { request, approve: (actor: string, reason?: string) => decide("approve", actor, reason), deny: (actor: string, reason?: string) => decide("deny", actor, reason), revoke: (actor: string, reason?: string) => decide("revoke", actor, reason) };
}
