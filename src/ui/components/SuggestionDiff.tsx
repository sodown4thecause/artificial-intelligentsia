import type { ProtectedRange } from "../../rewrites/types.js";

interface SuggestionDiffProps {
  readonly originalText: string;
  readonly suggestedText: string;
  readonly protectedRanges: readonly ProtectedRange[];
}

function protectedPreview(text: string, ranges: readonly ProtectedRange[]) {
  const protectedTexts = new Set(ranges.filter((range) => !range.authorized).map((range) => range.text));
  if (protectedTexts.size === 0) return text;
  const expression = new RegExp(`(${[...protectedTexts].map(escapeRegex).join("|")})`, "g");
  return text.split(expression).map((part, index) => protectedTexts.has(part)
    ? <mark key={`${part}-${index}`} aria-label={`Protected content: ${part}`}>{part}</mark>
    : part,
  );
}

function escapeRegex(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/** A compact, accessible block-level before/after preview. */
export function SuggestionDiff({ originalText, suggestedText, protectedRanges }: SuggestionDiffProps) {
  return <div aria-label="Suggestion diff" className="suggestion-diff">
    <p><strong>Original</strong>: {protectedPreview(originalText, protectedRanges)}</p>
    <p><strong>Suggested</strong>: {protectedPreview(suggestedText, protectedRanges)}</p>
  </div>;
}
