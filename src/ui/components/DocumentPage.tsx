import { useEffect, useState } from "react";
import type { DocumentRepository } from "../../documents/repository.js";
import type { DocumentActor, DocumentContent } from "../../documents/types.js";
import { useDocument } from "../hooks/useDocument.js";
import { DocumentEditor } from "./DocumentEditor.js";
import { DocumentToolbar } from "./DocumentToolbar.js";
import { VersionHistory } from "./VersionHistory.js";

interface DocumentPageProps {
  readonly repository: DocumentRepository;
  readonly actor: DocumentActor;
  readonly documentId: string;
  readonly confirmRestore?: (message: string) => boolean;
}

export function DocumentPage({ repository, actor, documentId, confirmRestore = () => true }: DocumentPageProps) {
  const { document, versions, error, loading, save, restore } = useDocument(repository, actor, documentId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<DocumentContent>({ blocks: [] });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { if (document !== undefined) { setTitle(document.title); setContent(document.content); } }, [document]);
  if (loading) return <p>Loading document…</p>;
  if (error !== undefined) return <p role="alert">{error}</p>;
  if (document === undefined) return null;
  const saveDocument = async () => {
    setSaveStatus("saving");
    try { await save({ title, content, expectedVersion: document.currentVersion }); setSaveStatus("saved"); }
    catch { setSaveStatus("error"); }
  };
  const restoreVersion = async (versionNumber: number) => {
    try { await restore(versionNumber); setSaveStatus("saved"); setShowHistory(false); }
    catch { setSaveStatus("error"); }
  };
  return <article aria-label="Document page">
    <input aria-label="Document title" value={title} onChange={(event) => { setTitle(event.target.value); setSaveStatus("idle"); }} />
    <DocumentToolbar saveStatus={saveStatus} onSave={() => void saveDocument()} onShowVersions={() => setShowHistory(true)} />
    <DocumentEditor value={content} onChange={(next) => { setContent(next); setSaveStatus("idle"); }} />
    {showHistory && <VersionHistory versions={versions} currentVersion={document.currentVersion} onRestore={(version) => void restoreVersion(version)} confirmRestore={(version) => confirmRestore(`Restore version ${version.versionNumber}? This creates a new version.`)} />}
  </article>;
}
