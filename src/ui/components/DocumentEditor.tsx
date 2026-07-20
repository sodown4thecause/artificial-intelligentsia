import type { ChangeEvent, ReactNode } from "react";
import type { DocumentBlock, DocumentContent } from "../../documents/types.js";

interface DocumentEditorProps {
  readonly value: DocumentContent;
  readonly onChange: (content: DocumentContent) => void;
  readonly disabled?: boolean;
  /** Optional adjacent workflow UI, such as the non-destructive rewrite panel. */
  readonly rewritePanel?: ReactNode;
}

function updateBlock(blocks: readonly DocumentBlock[], index: number, next: DocumentBlock): DocumentContent {
  return { blocks: blocks.map((block, blockIndex) => blockIndex === index ? next : block) };
}

function blockText(block: DocumentBlock): string {
  if (block.type === "list") return block.items.join("\n");
  if (block.type === "table") return block.rows.map((row) => row.join(" | ")).join("\n");
  if (block.type === "attachment") return block.caption ?? "";
  return block.text;
}

/** A controlled, safe block editor. Tables use pipe-separated rows by design. */
export function DocumentEditor({ value, onChange, disabled = false, rewritePanel }: DocumentEditorProps) {
  const add = (block: DocumentBlock) => onChange({ blocks: [...value.blocks, block] });
  const edit = (index: number, event: ChangeEvent<HTMLTextAreaElement>) => {
    const block = value.blocks[index];
    const text = event.target.value;
    if (block.type === "list") onChange(updateBlock(value.blocks, index, { ...block, items: text.split("\n") }));
    else if (block.type === "table") onChange(updateBlock(value.blocks, index, { ...block, rows: text.split("\n").map((row) => row.split("|").map((cell) => cell.trim())) }));
    else if (block.type !== "attachment") onChange(updateBlock(value.blocks, index, { ...block, text }));
  };

  return <section aria-label="Document editor">
    <div role="toolbar" aria-label="Document blocks">
      <button type="button" onClick={() => add({ type: "paragraph", text: "" })} disabled={disabled}>Paragraph</button>
      <button type="button" onClick={() => add({ type: "heading", level: 2, text: "" })} disabled={disabled}>Heading</button>
      <button type="button" onClick={() => add({ type: "list", ordered: false, items: [""] })} disabled={disabled}>List</button>
      <button type="button" onClick={() => add({ type: "table", rows: [["", ""]] })} disabled={disabled}>Table</button>
    </div>
    {rewritePanel}
    {value.blocks.map((block, index) => <label key={`${block.type}-${index}`}>
      <span>{block.type === "heading" ? `Heading ${block.level}` : block.type}</span>
      <textarea aria-label={`${block.type} ${index + 1}`} value={blockText(block)} onChange={(event) => edit(index, event)} disabled={disabled} />
    </label>)}
  </section>;
}
