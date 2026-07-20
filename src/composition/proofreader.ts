import { createSensitiveContentReference } from "../core/audit/types.js";
import { executeWithFallback, type GatewayExecutionResult } from "../core/gateway/router.js";
import { PermissionClass, type ActionDecision, type ActionMetadata } from "../core/permissions/types.js";
import { DocumentRepository } from "../documents/repository.js";
import type { DocumentActor, DocumentBlock, DocumentContent, EditableDocument } from "../documents/types.js";
import { detectProtectedRanges, uniqueRanges } from "../rewrites/protected.js";
import type { CompositionAuditSink, CompositionPermissionCheck, ProofreadingGenerationInput, ProofreadingIssue, ProofreadingRequest, ProofreadingResponse } from "./types.js";

const SECRET_PATTERN = /(?:api[_-]?key|password|secret|token)\s*[:=]\s*[^\s]+|(?:sk|ghp)_[A-Za-z0-9_-]{16,}/i;

export const proofreadingGenerationAction: ActionMetadata = { id: "proofreading.generate", permissionClass: PermissionClass.ReadOnly, description: "Generate non-destructive proofreading issues" };
export const proofreadingApplicationAction: ActionMetadata = { id: "proofreading.apply", permissionClass: PermissionClass.LocalReversibleWrite, description: "Apply approved proofreading issues" };

type GatewayExecutor = (request: ProofreadingRequest) => Promise<ProofreadingResponse>;
function defaultPermissionCheck(): Promise<ActionDecision> { return Promise.resolve("auto-approve"); }
async function defaultExecutor(request: ProofreadingRequest): Promise<ProofreadingResponse> {
  const result: GatewayExecutionResult<ProofreadingRequest> = await executeWithFallback("rewrite_extraction_summarization", request, { estimatedCost: 0.02 });
  if (result.kind === "rejected") throw new Error(`Proofreading request rejected by gateway policy: ${result.reason}.`);
  return result.response.request.mockResponse ?? { issues: [] };
}
function editableText(block: DocumentBlock): string | null {
  if (block.type === "attachment") return null;
  if (block.type === "list") return block.items.join("\n");
  if (block.type === "table") return block.rows.map((row) => row.join(" | ")).join("\n");
  return block.text;
}
function validIssue(issue: ProofreadingIssue): boolean {
  return typeof issue.id === "string" && typeof issue.documentId === "string" && Number.isInteger(issue.baseVersion) && Number.isInteger(issue.blockIndex) && Number.isInteger(issue.start) && Number.isInteger(issue.end) && typeof issue.originalText === "string" && typeof issue.suggestedText === "string" && ["grammar", "spelling", "clarity", "style", "punctuation"].includes(issue.category) && ["low", "medium", "high"].includes(issue.severity) && typeof issue.explanation === "string" && ["pending", "accepted", "rejected"].includes(issue.status);
}
function replacement(block: DocumentBlock, text: string): DocumentBlock {
  if (block.type === "attachment") throw new Error("Proofreading cannot modify attachments.");
  if (block.type === "list") return { ...block, items: text.split("\n") };
  if (block.type === "table") return { ...block, rows: text.split("\n").map((row) => row.split("|").map((cell) => cell.trim())) };
  return { ...block, text };
}
export function groupProofreadingIssues(issues: readonly ProofreadingIssue[]): ReadonlyMap<string, readonly ProofreadingIssue[]> {
  const groups = new Map<string, ProofreadingIssue[]>();
  for (const issue of issues) { const key = `${issue.category}:${issue.severity}`; groups.set(key, [...(groups.get(key) ?? []), issue]); }
  return groups;
}

export class ProofreaderEngine {
  constructor(private readonly executor: GatewayExecutor = defaultExecutor, private readonly permissionCheck: CompositionPermissionCheck = defaultPermissionCheck, private readonly audit?: CompositionAuditSink) {}

  async generate(input: ProofreadingGenerationInput): Promise<readonly ProofreadingIssue[]> {
    const decision = await this.permissionCheck(proofreadingGenerationAction);
    if (decision === "blocked") throw new Error("Proofreading generation is not permitted.");
    const ranges = uniqueRanges([...detectProtectedRanges(input.document.content), ...(input.protectedRanges ?? [])]);
    const request: ProofreadingRequest = { documentId: input.document.id, baseVersion: input.document.currentVersion, content: input.document.content, protectedRanges: ranges, mockResponse: input.mockResponse };
    await this.writeAudit("proofreading.generate", input.document);
    const response = await this.executor(request);
    if (!Array.isArray(response.issues) || !response.issues.every(validIssue)) throw new Error("The proofreading gateway returned invalid issues.");
    const issues = response.issues.map((issue) => this.validateIssue(issue, request));
    await this.writeAudit("proofreading.preview", input.document, { count: issues.length });
    return issues;
  }

  async decide(issue: ProofreadingIssue, status: "accepted" | "rejected"): Promise<ProofreadingIssue> {
    const updated = { ...issue, status } as ProofreadingIssue;
    await this.audit?.write({ action: status === "accepted" ? "proofreading.accept" : "proofreading.reject", documentId: issue.documentId, version: issue.baseVersion, contentReferenceId: createSensitiveContentReference("proofreading-decision").id, metadata: { issueId: issue.id } });
    return updated;
  }

  async decideBatch(issues: readonly ProofreadingIssue[], status: "accepted" | "rejected"): Promise<readonly ProofreadingIssue[]> {
    return Promise.all(issues.map((issue) => this.decide(issue, status)));
  }

  async apply(repository: DocumentRepository, actor: DocumentActor, documentId: string, expectedVersion: number, issues: readonly ProofreadingIssue[]): Promise<EditableDocument> {
    const decision = await this.permissionCheck(proofreadingApplicationAction);
    if (decision === "blocked") throw new Error("Applying proofreading issues is not permitted.");
    const current = await repository.get(actor, documentId);
    if (current.currentVersion !== expectedVersion) throw new Error("Proofreading issues are stale; refresh the document before applying them.");
    const accepted = issues.filter((issue) => issue.status === "accepted");
    if (accepted.some((issue) => issue.documentId !== documentId || issue.baseVersion !== expectedVersion)) throw new Error("A proofreading issue belongs to another document version.");
    const byBlock = new Map<number, ProofreadingIssue[]>();
    for (const issue of accepted) byBlock.set(issue.blockIndex, [...(byBlock.get(issue.blockIndex) ?? []), issue]);
    const content: DocumentContent = { blocks: current.content.blocks.map((block, index) => {
      const blockIssues = byBlock.get(index) ?? [];
      const original = editableText(block);
      if (blockIssues.length === 0) return block;
      if (original === null) throw new Error("A proofreading issue targets an attachment.");
      const sorted = [...blockIssues].sort((left, right) => right.start - left.start);
      let text = original;
      let previousStart = text.length + 1;
      for (const issue of sorted) {
        if (issue.start < 0 || issue.end < issue.start || issue.end > text.length || issue.end > previousStart || text.slice(issue.start, issue.end) !== issue.originalText) throw new Error("A proofreading issue no longer matches the document content.");
        text = `${text.slice(0, issue.start)}${issue.suggestedText}${text.slice(issue.end)}`;
        previousStart = issue.start;
      }
      return replacement(block, text);
    }) };
    const saved = await repository.save(actor, documentId, { title: current.title, content, expectedVersion, changeSummary: `Applied ${accepted.length} approved proofreading issue${accepted.length === 1 ? "" : "s"}` });
    await this.writeAudit("proofreading.apply", saved, { acceptedCount: accepted.length });
    return saved;
  }

  private validateIssue(issue: ProofreadingIssue, request: ProofreadingRequest): ProofreadingIssue {
    const block = request.content.blocks[issue.blockIndex]; const text = block === undefined ? null : editableText(block);
    if (issue.documentId !== request.documentId || issue.baseVersion !== request.baseVersion || text === null || issue.start < 0 || issue.end < issue.start || issue.end > text.length || text.slice(issue.start, issue.end) !== issue.originalText) throw new Error("The proofreading issue does not match the requested document block.");
    if (SECRET_PATTERN.test(`${issue.originalText}\n${issue.suggestedText}\n${issue.explanation}`)) throw new Error("The proofreading issue contains secret-like content.");
    const protectedRanges = request.protectedRanges.filter((range) => range.blockIndex === issue.blockIndex && !range.authorized);
    if (protectedRanges.some((range) => issue.start < range.end && issue.end > range.start)) throw new Error("The proofreading issue changes protected content.");
    return { ...issue, status: "pending" };
  }
  private async writeAudit(action: "proofreading.generate" | "proofreading.preview" | "proofreading.apply", document: EditableDocument, metadata?: Readonly<Record<string, string | number | boolean>>): Promise<void> {
    await this.audit?.write({ action, workspaceId: document.workspaceId, documentId: document.id, version: document.currentVersion, contentReferenceId: createSensitiveContentReference("proofreader-engine").id, metadata });
  }
}
