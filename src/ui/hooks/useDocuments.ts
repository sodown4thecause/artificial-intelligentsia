import { useCallback, useEffect, useState } from "react";
import type { DocumentActor, EditableDocument } from "../../documents/types.js";
import type { DocumentSharePermission } from "../../documents/share.js";

export interface DocumentsApi {
  list(actor: DocumentActor, workspaceId: string): Promise<readonly EditableDocument[]>;
  share(actor: DocumentActor, documentId: string, userId: string, permission: DocumentSharePermission): Promise<unknown>;
  revokeShare(actor: DocumentActor, documentId: string, userId: string): Promise<void>;
}

export function useDocuments(api: DocumentsApi, actor: DocumentActor, workspaceId: string) {
  const [documents, setDocuments] = useState<readonly EditableDocument[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<Error | undefined>();
  const refresh = useCallback(async () => {
    try { setDocuments(await api.list(actor, workspaceId)); setError(undefined); }
    catch (cause) { setError(cause instanceof Error ? cause : new Error("Unable to load documents.")); }
  }, [api, actor, workspaceId]);
  useEffect(() => { void refresh(); }, [refresh]);
  const share = useCallback((documentId: string, userId: string, permission: DocumentSharePermission) => api.share(actor, documentId, userId, permission), [api, actor]);
  const revokeShare = useCallback((documentId: string, userId: string) => api.revokeShare(actor, documentId, userId), [api, actor]);
  const normalized = query.trim().toLocaleLowerCase();
  return { documents: normalized ? documents.filter((document) => document.title.toLocaleLowerCase().includes(normalized)) : documents, query, setQuery, error, refresh, share, revokeShare };
}
