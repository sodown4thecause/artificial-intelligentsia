import { useMemo, useState } from "react";
import type { CompositionDraft } from "../../composition/types.js";
import type { EditableDocument } from "../../documents/types.js";

export interface CompositionPanelProps {
  readonly workspaceId: string;
  readonly sourceDocuments: readonly EditableDocument[];
  readonly generate: (input: { workspaceId: string; prompt: string; title?: string; sourceDocument?: EditableDocument }) => Promise<CompositionDraft>;
  readonly save: (draft: CompositionDraft) => Promise<CompositionDraft>;
  readonly apply: (draft: CompositionDraft, documentId?: string, expectedVersion?: number) => Promise<unknown>;
  readonly discard: (draft: CompositionDraft) => Promise<unknown>;
}

function DraftPreview({ draft }: { readonly draft: CompositionDraft }) {
  return <section aria-label="Draft preview">
    <h3>{draft.title ?? "Untitled draft"}</h3>
    {draft.content.blocks.map((block, index) => {
      if (block.type === "heading") { const Tag = `h${block.level}` as "h1" | "h2" | "h3"; return <Tag key={index}>{block.text}</Tag>; }
      if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
      if (block.type === "list") { const Tag = block.ordered ? "ol" : "ul"; return <Tag key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</Tag>; }
      if (block.type === "table") return <table key={index}><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table>;
      return <p key={index}>Attachment: {block.caption ?? block.attachmentId}</p>;
    })}
  </section>;
}

/** A preview-first composition surface: generated content remains a draft until explicit apply. */
export function CompositionPanel({ workspaceId, sourceDocuments, generate, save, apply, discard }: CompositionPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [draft, setDraft] = useState<CompositionDraft | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const source = useMemo(() => sourceDocuments.find((document) => document.id === sourceId), [sourceDocuments, sourceId]);
  const generateDraft = async () => {
    if (prompt.trim() === "") { setMessage("Enter a prompt before generating."); return; }
    try { const generated = await generate({ workspaceId, prompt, title: title || undefined, sourceDocument: source }); setDraft(generated); setMessage(null); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Composition generation failed."); }
  };
  const saveDraft = async () => { if (draft !== null) { const saved = await save(draft); setDraft(saved); setMessage("Draft saved."); } };
  const applyDraft = async () => { if (draft !== null) { await apply(draft, source?.id, source?.currentVersion); setDraft({ ...draft, status: "applied" }); setMessage("Draft applied."); } };
  const discardDraft = async () => { if (draft !== null) { await discard(draft); setDraft(null); setMessage("Draft discarded."); } };
  return <section aria-label="Composition">
    <h2>Compose</h2>
    <label htmlFor="composition-title">Title</label>
    <input id="composition-title" value={title} onChange={(event) => setTitle(event.target.value)} />
    <label htmlFor="composition-source">Source document</label>
    <select id="composition-source" value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
      <option value="">No source document</option>
      {sourceDocuments.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
    </select>
    <label htmlFor="composition-prompt">Prompt or outline</label>
    <textarea id="composition-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
    <button type="button" onClick={() => { void generateDraft(); }}>{draft === null ? "Generate draft" : "Regenerate draft"}</button>
    {message !== null && <p role="status">{message}</p>}
    {draft !== null && <>
      <DraftPreview draft={draft} />
      <button type="button" onClick={() => { void saveDraft(); }}>Save draft</button>
      <button type="button" onClick={() => { void applyDraft(); }}>Apply to document</button>
      <button type="button" onClick={() => { void discardDraft(); }}>Discard draft</button>
    </>}
  </section>;
}
