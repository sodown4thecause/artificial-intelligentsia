import { useCallback, useState } from "react";
import { CompositionEngine } from "../../composition/engine.js";
import { CompositionDraftRepository } from "../../composition/repository.js";
import type { CompositionDraft, CompositionGenerationInput } from "../../composition/types.js";
import type { DocumentActor, EditableDocument } from "../../documents/types.js";

export interface UseCompositionOptions {
  readonly engine: CompositionEngine;
  readonly repository: CompositionDraftRepository;
  readonly actor: DocumentActor;
}

export function useComposition({ engine, repository, actor }: UseCompositionOptions) {
  const [draft, setDraft] = useState<CompositionDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generate = useCallback(async (input: CompositionGenerationInput) => {
    setIsGenerating(true); setError(null);
    try { const generated = await engine.generate(input); setDraft(generated); return generated; }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Composition generation failed."); throw reason; }
    finally { setIsGenerating(false); }
  }, [engine]);
  const save = useCallback(async () => { if (draft === null) throw new Error("There is no draft to save."); const saved = await repository.save(actor, draft); setDraft(saved); return saved; }, [actor, draft, repository]);
  const apply = useCallback(async (documentId?: string, expectedVersion?: number): Promise<EditableDocument> => { if (draft === null) throw new Error("There is no draft to apply."); const applied = await repository.apply(actor, draft.id, documentId, expectedVersion); setDraft((current) => current === null ? null : { ...current, status: "applied" }); return applied; }, [actor, draft, repository]);
  const discard = useCallback(async () => { if (draft === null) return; await repository.discard(actor, draft.id); setDraft(null); }, [actor, draft, repository]);
  return { draft, isGenerating, error, generate, save, apply, discard };
}
