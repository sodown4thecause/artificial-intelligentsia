export class MailDraftApprovalGate {
  private readonly approvedDraftIds = new Set<string>();

  public approve(draftId: string): void {
    if (draftId.trim() === "") throw new Error("A draft id is required for approval.");
    this.approvedDraftIds.add(draftId);
  }

  public revoke(draftId: string): void {
    this.approvedDraftIds.delete(draftId);
  }

  public isApproved(draftId: string): boolean {
    return this.approvedDraftIds.has(draftId);
  }

  /** This protects any future delivery integration. MailService deliberately has no send operation. */
  public requireApprovalForExternalSend(draftId: string): void {
    if (!this.isApproved(draftId)) throw new Error("Explicit user approval is required before sending email.");
  }
}
