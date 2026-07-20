import { createSensitiveContentReference } from "../core/audit/types.js";
import { PermissionClass, type ActionMetadata } from "../core/permissions/types.js";
import { DocumentRepository } from "../documents/repository.js";
import type { DocumentActor, DocumentBlock, DocumentContent, EditableDocument } from "../documents/types.js";
import type { RewriteAuditSink, RewritePermissionCheck, RewriteSuggestion } from "./types.js";

export const rewriteApplicationAction: ActionMetadata = {
  id: "rewrite.apply", permissionClass: PermissionClass.LocalReversibleWrite,
  description: "Apply user-approved local rewrite suggestions after preview",
};

export interface RewriteApplyContext {
  readonly repository: DocumentRepository;
  readonly actor: DocumentActor;
  readonly documentId: string;
  readonly permissionCheck: RewritePermissionCheck;
  readonly audit?: RewriteAuditSink;
}

function replacement(block: DocumentBlock, suggestedText: string): DocumentBlock {
  if (block.type === "attachment") throw new Error("Rewrite suggestions cannot modify attachments.");
  if (block.type === "list") return { ...block, items: suggestedText.split("\n") };
  if (block.type === "table") return { ...block, rows: suggestedText.split("\n").map((row) => row.split("|").map((cell) => cell.trim())) };
  return { ...block, text: suggestedText };
}

/**
 * Re-fetches immediately before saving so stale suggestions can never overwrite
 * an intervening document edit. Only explicitly accepted suggestions are used.
 */
export async function applySuggestions(
  context: RewriteApplyContext,
  suggestions: readonly RewriteSuggestion[],
  expectedVersion: number,
): Promise<EditableDocument> {
  const decision = await context.permissionCheck(rewriteApplicationAction);
  if (decision === "blocked") throw new Error("Applying rewrites is not permitted.");
  const current = await context.repository.get(context.actor, context.documentId);
  if (current.currentVersion !== expectedVersion) throw new Error("Rewrite suggestions are stale; refresh the document before applying them.");
  const accepted = suggestions.filter((suggestion) => suggestion.status === "accepted");
  if (accepted.some((suggestion) => suggestion.documentId !== current.id || suggestion.baseVersion !== expectedVersion)) {
    throw new Error("A rewrite suggestion belongs to another document version.");
  }
  const byBlock = new Map<number, RewriteSuggestion>();
  for (const suggestion of accepted) {
    if (byBlock.has(suggestion.blockIndex)) throw new Error("Only one rewrite suggestion may be accepted for each block.");
    const block = current.content.blocks[suggestion.blockIndex];
    if (block === undefined || block.type === "attachment") throw new Error("A rewrite suggestion targets an invalid block.");
    byBlock.set(suggestion.blockIndex, suggestion);
  }
  const content: DocumentContent = {
    blocks: current.content.blocks.map((block, index) => {
      const suggestion = byBlock.get(index);
      return suggestion === undefined ? block : replacement(block, suggestion.suggestedText);
    }),
  };
  const saved = await context.repository.save(context.actor, current.id, {
    title: current.title, content, expectedVersion, changeSummary: `Applied ${accepted.length} approved rewrite suggestion${accepted.length === 1 ? "" : "s"}`,
  });
  await context.audit?.write({
    action: "rewrite.apply", documentId: current.id, version: saved.currentVersion,
    contentReferenceId: createSensitiveContentReference("rewrite-apply").id,
    metadata: { acceptedCount: accepted.length, approval: "preview-and-approval" },
  });
  return saved;
}

export async function auditSuggestionDecision(
  audit: RewriteAuditSink | undefined,
  action: "rewrite.accept" | "rewrite.reject",
  suggestion: RewriteSuggestion,
): Promise<void> {
  await audit?.write({
    action, documentId: suggestion.documentId, version: suggestion.baseVersion,
    contentReferenceId: createSensitiveContentReference("rewrite-suggestion").id,
    metadata: { suggestionId: suggestion.id, blockIndex: suggestion.blockIndex },
  });
}
