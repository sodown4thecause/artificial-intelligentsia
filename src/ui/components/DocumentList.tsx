import type { EditableDocument } from "../../documents/types.js";

export interface DocumentListProps {
  readonly documents: readonly EditableDocument[];
  readonly query?: string;
  readonly onSelect: (document: EditableDocument) => void;
}

export function filterDocuments(documents: readonly EditableDocument[], query = ""): readonly EditableDocument[] {
  const term = query.trim().toLocaleLowerCase();
  return !term ? documents : documents.filter((document) => document.title.toLocaleLowerCase().includes(term));
}

export function DocumentList({ documents, query, onSelect }: DocumentListProps) {
  const visible = filterDocuments(documents, query);
  return <section aria-label="Documents">
    <ul>{visible.map((document) => <li key={document.id}>
      <button type="button" onClick={() => onSelect(document)}>{document.title}</button>
    </li>)}</ul>
    {visible.length === 0 && <p>No documents found.</p>}
  </section>;
}
