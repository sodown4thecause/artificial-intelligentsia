import { createSensitiveContentReference } from "../core/audit/types.js";
import { executeWithFallback, type GatewayExecutionResult } from "../core/gateway/router.js";
import { PermissionClass, type ActionDecision, type ActionMetadata } from "../core/permissions/types.js";
import type { DocumentBlock } from "../documents/types.js";
import { detectProtectedRanges, uniqueRanges } from "./protected.js";
import type { ProtectedRange, RewriteAuditSink, RewriteGenerationInput, RewritePermissionCheck, RewriteRequest, RewriteResponse, RewriteSuggestion } from "./types.js";

const SECRET_PATTERN = /(?:api[_-]?key|password|secret|token)\s*[:=]\s*[^\s]+|(?:sk|ghp)_[A-Za-z0-9_-]{16,}/i;

export const rewriteGenerationAction: ActionMetadata = {
  id: "rewrite.generate", permissionClass: PermissionClass.ReadOnly, description: "Generate non-destructive rewrite suggestions",
};

type GatewayExecutor = (request: RewriteRequest) => Promise<RewriteResponse>;

function editableText(block: DocumentBlock): string | null {
  if (block.type === "attachment") return null;
  if (block.type === "list") return block.items.join("\n");
  if (block.type === "table") return block.rows.map((row) => row.join(" | ")).join("\n");
  return block.text;
}

function defaultPermissionCheck(): Promise<ActionDecision> { return Promise.resolve("auto-approve"); }

async function defaultExecutor(request: RewriteRequest): Promise<RewriteResponse> {
  const result: GatewayExecutionResult<RewriteRequest> = await executeWithFallback("rewrite_extraction_summarization", request, { estimatedCost: 0.02 });
  if (result.kind === "rejected") throw new Error(`Rewrite request rejected by gateway policy: ${result.reason}.`);
  return result.response.request.mockResponse ?? { suggestions: [] };
}

function responseIsValid(response: RewriteResponse): boolean {
  return Array.isArray(response.suggestions) && response.suggestions.every((suggestion) =>
    typeof suggestion.id === "string" && typeof suggestion.documentId === "string" &&
    Number.isInteger(suggestion.baseVersion) && Number.isInteger(suggestion.blockIndex) &&
    typeof suggestion.originalText === "string" && typeof suggestion.suggestedText === "string" &&
    Array.isArray(suggestion.protectedRanges) && typeof suggestion.reason === "string" &&
    ["correctness", "professional", "friendly", "concise", "neutral"].includes(suggestion.tone) &&
    ["pending", "accepted", "rejected"].includes(suggestion.status),
  );
}

function protectedContentPreserved(original: string, suggested: string, ranges: readonly ProtectedRange[]): boolean {
  return ranges.filter((range) => !range.authorized).every((range) =>
    original.slice(range.start, range.end) === range.text && suggested.includes(range.text),
  );
}

/** Builds and validates constrained, non-destructive suggestions from the gateway seam. */
export class RewriteEngine {
  constructor(
    private readonly executor: GatewayExecutor = defaultExecutor,
    private readonly permissionCheck: RewritePermissionCheck = defaultPermissionCheck,
    private readonly audit?: RewriteAuditSink,
  ) {}

  async generate(input: RewriteGenerationInput): Promise<readonly RewriteSuggestion[]> {
    const decision = await this.permissionCheck(rewriteGenerationAction);
    if (decision === "blocked") throw new Error("Rewrite generation is not permitted.");
    const detected = detectProtectedRanges(input.document.content);
    const protectedRanges = uniqueRanges([...detected, ...(input.protectedRanges ?? [])]);
    const attachmentIds = input.document.content.blocks
      .filter((block): block is Extract<DocumentBlock, { type: "attachment" }> => block.type === "attachment")
      .map((block) => block.attachmentId);
    const request: RewriteRequest = {
      documentId: input.document.id, baseVersion: input.document.currentVersion, content: input.document.content,
      instructions: input.instructions, tone: input.tone, protectedRanges,
      blockCount: input.document.content.blocks.length, attachmentIds,
    };
    await this.writeAudit("rewrite.generate", input.document.id, input.document.currentVersion, { tone: input.tone });
    const response = await this.executor(request);
    if (!responseIsValid(response)) throw new Error("The rewrite gateway returned an invalid response.");
    if ((response.blockCount !== undefined && response.blockCount !== request.blockCount) ||
      (response.attachmentIds !== undefined && (response.attachmentIds.length !== attachmentIds.length || response.attachmentIds.some((id, index) => id !== attachmentIds[index])))) {
      throw new Error("The rewrite response attempted to alter document structure or attachments.");
    }
    const suggestions = response.suggestions.map((suggestion) => this.validateSuggestion(suggestion, request));
    await this.writeAudit("rewrite.preview", input.document.id, input.document.currentVersion, { count: suggestions.length });
    return suggestions;
  }

  private validateSuggestion(suggestion: RewriteSuggestion, request: RewriteRequest): RewriteSuggestion {
    const block = request.content.blocks[suggestion.blockIndex];
    const original = block === undefined ? null : editableText(block);
    if (suggestion.documentId !== request.documentId || suggestion.baseVersion !== request.baseVersion || original === null || suggestion.originalText !== original) {
      throw new Error("The rewrite suggestion does not match the requested document block.");
    }
    if (SECRET_PATTERN.test(suggestion.suggestedText)) throw new Error("The rewrite suggestion contains secret-like content.");
    const ranges = request.protectedRanges.filter((range) => range.blockIndex === suggestion.blockIndex);
    if (!protectedContentPreserved(original, suggestion.suggestedText, ranges)) throw new Error("The rewrite suggestion changes protected content.");
    return { ...suggestion, protectedRanges: ranges, status: "pending" };
  }

  private async writeAudit(action: "rewrite.generate" | "rewrite.preview", documentId: string, version: number, metadata: Readonly<Record<string, string | number | boolean>>): Promise<void> {
    await this.audit?.write({ action, documentId, version, contentReferenceId: createSensitiveContentReference("rewrite-engine").id, metadata });
  }
}
