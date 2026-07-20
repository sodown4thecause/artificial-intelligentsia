import { createSensitiveContentReference } from "../core/audit/types.js";
import { PermissionClass, type ActionDecision, type ActionMetadata } from "../core/permissions/types.js";
import { DocumentRepository } from "../documents/repository.js";
import type { DocumentActor, EditableDocument } from "../documents/types.js";
import type { CompositionAuditSink, CompositionDraft, CompositionPermissionCheck } from "./types.js";

export const compositionSaveAction: ActionMetadata = { id: "composition.save", permissionClass: PermissionClass.LocalReversibleWrite, description: "Save a generated composition draft" };
export const compositionApplyAction: ActionMetadata = { id: "composition.apply", permissionClass: PermissionClass.LocalReversibleWrite, description: "Apply an approved composition draft" };
export const compositionDiscardAction: ActionMetadata = { id: "composition.discard", permissionClass: PermissionClass.LocalReversibleWrite, description: "Discard a composition draft" };

function defaultPermissionCheck(): Promise<ActionDecision> { return Promise.resolve("auto-approve"); }
function cloneDraft(draft: CompositionDraft): CompositionDraft { return JSON.parse(JSON.stringify(draft)) as CompositionDraft; }

/** Draft persistence is intentionally separate from immutable document versions. */
export class CompositionDraftRepository {
  private readonly drafts = new Map<string, CompositionDraft>();

  constructor(
    private readonly documents: DocumentRepository,
    private readonly permissionCheck: CompositionPermissionCheck = defaultPermissionCheck,
    private readonly audit?: CompositionAuditSink,
    private readonly clock: () => string = () => new Date().toISOString(),
  ) {}

  async save(actor: DocumentActor, draft: CompositionDraft): Promise<CompositionDraft> {
    this.assertWorkspace(actor, draft.workspaceId);
    await this.assertAllowed(compositionSaveAction, "Saving composition drafts is not permitted.");
    const saved = { ...cloneDraft(draft), status: "saved" as const, updatedAt: this.clock() };
    this.drafts.set(saved.id, saved);
    await this.writeAudit("composition.save", actor, saved, { draftId: saved.id });
    return cloneDraft(saved);
  }

  async list(actor: DocumentActor, workspaceId: string): Promise<readonly CompositionDraft[]> {
    this.assertWorkspace(actor, workspaceId);
    return [...this.drafts.values()].filter((draft) => draft.workspaceId === workspaceId && draft.status !== "discarded").map(cloneDraft);
  }

  async apply(actor: DocumentActor, draftId: string, targetDocumentId?: string, expectedVersion?: number): Promise<EditableDocument> {
    const draft = this.require(draftId);
    this.assertWorkspace(actor, draft.workspaceId);
    await this.assertAllowed(compositionApplyAction, "Applying composition drafts is not permitted.");
    const documentId = targetDocumentId ?? draft.sourceDocumentId;
    const applied = documentId === undefined
      ? await this.documents.create(actor, { workspaceId: draft.workspaceId, title: draft.title ?? "Untitled draft", content: draft.content })
      : await this.applyToExisting(actor, draft, documentId, expectedVersion);
    const updated = { ...draft, status: "applied" as const, updatedAt: this.clock() };
    this.drafts.set(draftId, updated);
    await this.writeAudit("composition.apply", actor, updated, { draftId, targetDocumentId: applied.id, version: applied.currentVersion });
    return applied;
  }

  async discard(actor: DocumentActor, draftId: string): Promise<CompositionDraft> {
    const draft = this.require(draftId);
    this.assertWorkspace(actor, draft.workspaceId);
    await this.assertAllowed(compositionDiscardAction, "Discarding composition drafts is not permitted.");
    const discarded = { ...draft, status: "discarded" as const, updatedAt: this.clock() };
    this.drafts.set(draftId, discarded);
    await this.writeAudit("composition.discard", actor, discarded, { draftId });
    return cloneDraft(discarded);
  }

  private async applyToExisting(actor: DocumentActor, draft: CompositionDraft, documentId: string, expectedVersion?: number): Promise<EditableDocument> {
    const current = await this.documents.get(actor, documentId);
    if (current.workspaceId !== draft.workspaceId) throw new Error("A composition draft cannot be applied across workspaces.");
    const version = expectedVersion ?? draft.baseVersion;
    if (version === undefined) throw new Error("An expected document version is required when overwriting a document.");
    if (current.currentVersion !== version) throw new Error("The composition draft is stale; refresh the document before applying it.");
    return this.documents.save(actor, documentId, { title: draft.title ?? current.title, content: draft.content, expectedVersion: version, changeSummary: "Applied composition draft" });
  }

  private require(draftId: string): CompositionDraft {
    const draft = this.drafts.get(draftId);
    if (draft === undefined) throw new Error("The composition draft does not exist.");
    return draft;
  }
  private assertWorkspace(actor: DocumentActor, workspaceId: string): void {
    if (actor.workspaceId !== workspaceId) throw new Error("The actor cannot access this workspace.");
  }
  private async assertAllowed(action: ActionMetadata, message: string): Promise<void> {
    if (await this.permissionCheck(action) === "blocked") throw new Error(message);
  }
  private async writeAudit(action: "composition.save" | "composition.apply" | "composition.discard", actor: DocumentActor, draft: CompositionDraft, metadata: Readonly<Record<string, string | number | boolean>>): Promise<void> {
    await this.audit?.write({ action, actor, workspaceId: draft.workspaceId, documentId: draft.sourceDocumentId, version: draft.baseVersion, contentReferenceId: createSensitiveContentReference("composition-draft").id, metadata });
  }
}
