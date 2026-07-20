import { useCallback, useMemo, useState } from "react";
import { groupProofreadingIssues, ProofreaderEngine } from "../../composition/proofreader.js";
import type { ProofreadingGenerationInput, ProofreadingIssue } from "../../composition/types.js";
import { DocumentRepository } from "../../documents/repository.js";
import type { DocumentActor, EditableDocument } from "../../documents/types.js";

export function useProofreader(engine: ProofreaderEngine) {
  const [issues, setIssues] = useState<readonly ProofreadingIssue[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generate = useCallback(async (input: ProofreadingGenerationInput) => { setIsGenerating(true); setError(null); try { const generated = await engine.generate(input); setIssues(generated); return generated; } catch (reason) { setError(reason instanceof Error ? reason.message : "Proofreading failed."); throw reason; } finally { setIsGenerating(false); } }, [engine]);
  const decide = useCallback(async (id: string, status: "accepted" | "rejected") => { const target = issues.find((issue) => issue.id === id); if (target === undefined) throw new Error("The proofreading issue does not exist."); const updated = await engine.decide(target, status); setIssues((current) => current.map((issue) => issue.id === id ? updated : issue)); return updated; }, [engine, issues]);
  const decideBatch = useCallback(async (status: "accepted" | "rejected") => { const updated = await engine.decideBatch(issues, status); setIssues(updated); return updated; }, [engine, issues]);
  const apply = useCallback(async (repository: DocumentRepository, actor: DocumentActor, documentId: string, expectedVersion: number): Promise<EditableDocument> => engine.apply(repository, actor, documentId, expectedVersion, issues), [engine, issues]);
  const groups = useMemo(() => groupProofreadingIssues(issues), [issues]);
  return { issues, groups, isGenerating, error, generate, decide, decideBatch, apply };
}
