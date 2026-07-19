// WRITE-006 — Citation formatting. Never fabricate missing fields.
export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'generic-linked';

export interface Citation {
  authors?: string[];
  year?: string;
  title?: string;
  publisher?: string;
  url?: string;
  accessed?: string;
}

const MISSING = 'n/a';

function names(c: Citation): string {
  if (!c.authors || c.authors.length === 0) return MISSING;
  if (c.authors.length === 1) return c.authors[0];
  if (c.authors.length === 2) return `${c.authors[0]} & ${c.authors[1]}`;
  return `${c.authors[0]} et al.`;
}

export function formatCitation(c: Citation, style: CitationStyle): string {
  const title = c.title ?? MISSING;
  switch (style) {
    case 'APA':
      return `(${names(c)}, ${c.year ?? MISSING}). ${title}. ${c.publisher ?? MISSING}.`;
    case 'MLA':
      return `${names(c)}. "${title}." ${c.publisher ?? MISSING}, ${c.year ?? MISSING}.`;
    case 'Chicago':
      return `${names(c)}. ${title}. ${c.publisher ?? MISSING}, ${c.year ?? MISSING}.`;
    case 'generic-linked':
      return c.url ? `[${title}](${c.url})` : `[${title}] (source ${MISSING})`;
  }
}
