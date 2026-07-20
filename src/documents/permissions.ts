import { DocumentAccessError } from "./types.js";
import type { DocumentActor, EditableDocument } from "./types.js";
import type { DocumentSharePermission, DocumentShareRepository } from "./share.js";

export class DocumentPermissionError extends DocumentAccessError {
  constructor() {
    super();
  }
}

export interface WorkspaceDocumentAuthorizer {
  canAccess(actor: DocumentActor, workspaceId: string): boolean | Promise<boolean>;
}

export async function canAccessDocument(
  actor: DocumentActor,
  document: EditableDocument,
  permission: DocumentSharePermission,
  workspaceAuthorizer: WorkspaceDocumentAuthorizer,
  shares: DocumentShareRepository,
): Promise<boolean> {
  if (actor.userId === document.createdByUserId) return true;
  if (document.visibility === "workspace" && actor.workspaceId === document.workspaceId && await workspaceAuthorizer.canAccess(actor, document.workspaceId)) return true;
  const share = shares.find(document.id, actor.userId);
  return share !== undefined && (permission === "read" || share.permission === "write");
}

export async function assertDocumentAccess(
  actor: DocumentActor,
  document: EditableDocument,
  permission: DocumentSharePermission,
  workspaceAuthorizer: WorkspaceDocumentAuthorizer,
  shares: DocumentShareRepository,
): Promise<void> {
  if (!await canAccessDocument(actor, document, permission, workspaceAuthorizer, shares)) throw new DocumentPermissionError();
}
