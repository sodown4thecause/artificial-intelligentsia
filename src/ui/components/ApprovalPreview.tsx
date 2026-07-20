import { buildApprovalPreview } from "../../approvals/preview.js";
import type { ApprovalRequest } from "../../approvals/types.js";

export interface ApprovalPreviewProps {
  readonly request: ApprovalRequest;
  readonly auditTrail?: readonly { type: string; actor: string; occurredAt: string; reason?: string }[];
}

export function ApprovalPreview({ request, auditTrail = [] }: ApprovalPreviewProps) {
  const preview = buildApprovalPreview(request);
  return (
    <section aria-label="Approval preview">
      <h3>Approval required</h3>
      <p>{preview.consequenceSummary}</p>
      <dl>
        <dt>Target</dt><dd>{preview.target}</dd>
        <dt>Payload</dt><dd>{preview.payloadSummary}</dd>
        <dt>Status</dt><dd>{request.status}</dd>
        {request.expiresAt !== undefined && <><dt>Expires</dt><dd>{request.expiresAt}</dd></>}
      </dl>
      <p>Preview includes: {preview.requiredFields.join(", ")}</p>
      {auditTrail.length > 0 && <section aria-label="Approval audit trail"><h4>Audit trail</h4><ul>{auditTrail.map((event, index) => <li key={`${event.occurredAt}-${index}`}>{event.type} by {event.actor} at {event.occurredAt}{event.reason === undefined ? "" : `: ${event.reason}`}</li>)}</ul></section>}
    </section>
  );
}
