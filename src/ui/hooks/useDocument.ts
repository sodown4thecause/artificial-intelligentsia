import { useCallback, useEffect, useState } from "react";
import type { DocumentRepository } from "../../documents/repository.js";
import type { DocumentActor, EditableDocument, EditableDocumentVersion, SaveDocumentInput } from "../../documents/types.js";

export function useDocument(repository: DocumentRepository, actor: DocumentActor, documentId: string) {
  const [document, setDocument] = useState<EditableDocument>();
  const [versions, setVersions] = useState<readonly EditableDocumentVersion[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextDocument, nextVersions] = await Promise.all([repository.get(actor, documentId), repository.listVersions(actor, documentId)]);
      setDocument(nextDocument); setVersions(nextVersions); setError(undefined);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load document."); }
    finally { setLoading(false); }
  }, [repository, actor, documentId]);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async (input: SaveDocumentInput) => {
    const saved = await repository.save(actor, documentId, input);
    setDocument(saved); setVersions(await repository.listVersions(actor, documentId));
    return saved;
  }, [repository, actor, documentId]);

  const restore = useCallback(async (versionNumber: number) => {
    if (document === undefined) throw new Error("Document is not loaded.");
    const restored = await repository.restore(actor, documentId, versionNumber, document.currentVersion);
    setDocument(restored); setVersions(await repository.listVersions(actor, documentId));
    return restored;
  }, [repository, actor, documentId, document]);

  return { document, versions, error, loading, load, save, restore };
}
