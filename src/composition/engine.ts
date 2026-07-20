import { createSensitiveContentReference } from "../core/audit/types.js";
import { executeWithFallback, type GatewayExecutionResult } from "../core/gateway/router.js";
import { PermissionClass, type ActionDecision, type ActionMetadata } from "../core/permissions/types.js";
import type { DocumentBlock, DocumentContent } from "../documents/types.js";
import type { CompositionAuditSink, CompositionDraft, CompositionGenerationInput, CompositionPermissionCheck, CompositionRequest, CompositionResponse } from "./types.js";

const SECRET_PATTERN = /(?:api[_-]?key|password|secret|token)\s*[:=]\s*[^\s]+|(?:sk|ghp)_[A-Za-z0-9_-]{16,}/i;

export const compositionGenerationAction: ActionMetadata = {
  id: "composition.generate", permissionClass: PermissionClass.ReadOnly,
  description: "Generate a non-destructive composition draft",
};

type GatewayExecutor = (request: CompositionRequest) => Promise<CompositionResponse>;

function defaultPermissionCheck(): Promise<ActionDecision> { return Promise.resolve("auto-approve"); }

async function defaultExecutor(request: CompositionRequest): Promise<CompositionResponse> {
  const result: GatewayExecutionResult<CompositionRequest> = await executeWithFallback("rewrite_extraction_summarization", request, { estimatedCost: 0.03 });
  if (result.kind === "rejected") throw new Error(`Composition request rejected by gateway policy: ${result.reason}.`);
  return result.response.request.mockResponse ?? { content: request.sourceContent ?? { blocks: [] }, title: request.title };
}

function cloneContent(content: DocumentContent): DocumentContent {
  return JSON.parse(JSON.stringify(content)) as DocumentContent;
}

function isBlock(block: unknown): block is DocumentBlock {
  if (typeof block !== "object" || block === null || !("type" in block)) return false;
  const candidate = block as Record<string, unknown>;
  if (candidate.type === "paragraph") return typeof candidate.text === "string";
  if (candidate.type === "heading") return typeof candidate.text === "string" && [1, 2, 3].includes(candidate.level as number);
  if (candidate.type === "list") return typeof candidate.ordered === "boolean" && Array.isArray(candidate.items) && candidate.items.every((item) => typeof item === "string");
  if (candidate.type === "table") return Array.isArray(candidate.rows) && candidate.rows.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"));
  return candidate.type === "attachment" && typeof candidate.attachmentId === "string" && (candidate.caption === undefined || typeof candidate.caption === "string");
}

export function isDocumentContent(value: unknown): value is DocumentContent {
  return typeof value === "object" && value !== null && "blocks" in value && Array.isArray((value as { blocks?: unknown }).blocks) && (value as { blocks: unknown[] }).blocks.every(isBlock);
}

function contentText(content: DocumentContent): string {
  return content.blocks.map((block) => block.type === "list" ? block.items.join("\n") : block.type === "table" ? block.rows.flat().join("\n") : block.type === "attachment" ? block.caption ?? "" : block.text).join("\n");
}

function preservesSourceStructure(source: DocumentContent, generated: DocumentContent): boolean {
  return source.blocks.length === generated.blocks.length && source.blocks.every((sourceBlock, index) => {
    const generatedBlock = generated.blocks[index];
    return generatedBlock !== undefined && sourceBlock.type === generatedBlock.type &&
      (sourceBlock.type !== "attachment" || (generatedBlock.type === "attachment" && sourceBlock.attachmentId === generatedBlock.attachmentId));
  });
}

function redactSecrets(text: string): string {
  return text.replace(SECRET_PATTERN, "[REDACTED]");
}

/** Generates only preview drafts; no document version is changed until repository apply. */
export class CompositionEngine {
  private nextId = 1;

  constructor(
    private readonly executor: GatewayExecutor = defaultExecutor,
    private readonly permissionCheck: CompositionPermissionCheck = defaultPermissionCheck,
    private readonly audit?: CompositionAuditSink,
    private readonly clock: () => string = () => new Date().toISOString(),
  ) {}

  async generate(input: CompositionGenerationInput): Promise<CompositionDraft> {
    const decision = await this.permissionCheck(compositionGenerationAction);
    if (decision === "blocked") throw new Error("Composition generation is not permitted.");
    const source = input.sourceDocument;
    const request: CompositionRequest = {
      workspaceId: input.workspaceId, prompt: redactSecrets(input.prompt), title: input.title,
      sourceDocumentId: source?.id, baseVersion: source?.currentVersion, sourceContent: source?.content, mockResponse: input.mockResponse,
    };
    await this.writeAudit("composition.generate", input.workspaceId, source?.id, source?.currentVersion);
    const response = await this.executor(request);
    if (!isDocumentContent(response.content) || (response.title !== undefined && typeof response.title !== "string")) throw new Error("The composition gateway returned invalid document content.");
    if (SECRET_PATTERN.test(`${response.title ?? ""}\n${contentText(response.content)}`)) throw new Error("The composition output contains secret-like content.");
    if (source !== undefined && !preservesSourceStructure(source.content, response.content)) throw new Error("The composition output attempted to alter source structure or attachments.");
    const timestamp = this.clock();
    const draft: CompositionDraft = {
      id: `draft-${this.nextId++}`, workspaceId: input.workspaceId, sourceDocumentId: source?.id, baseVersion: source?.currentVersion,
      prompt: request.prompt, title: response.title ?? input.title, content: cloneContent(response.content), status: "generated", createdAt: timestamp, updatedAt: timestamp,
    };
    await this.writeAudit("composition.preview", input.workspaceId, source?.id, source?.currentVersion, { draftId: draft.id });
    return draft;
  }

  private async writeAudit(action: "composition.generate" | "composition.preview", workspaceId: string, documentId?: string, version?: number, metadata?: Readonly<Record<string, string | number | boolean>>): Promise<void> {
    await this.audit?.write({ action, workspaceId, documentId, version, contentReferenceId: createSensitiveContentReference("composition-engine").id, metadata });
  }
}
