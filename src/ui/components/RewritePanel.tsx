import { useMemo, useState } from "react";
import type { EditableDocument } from "../../documents/types.js";
import { auditSuggestionDecision } from "../../rewrites/apply.js";
import { RewriteEngine } from "../../rewrites/engine.js";
import { createUserProtectedRange, detectProtectedRanges, uniqueRanges } from "../../rewrites/protected.js";
import type { ProtectedRange, RewriteAuditSink, RewriteSuggestion, RewriteTone } from "../../rewrites/types.js";
import { SuggestionDiff } from "./SuggestionDiff.js";

interface RewritePanelProps {
  readonly document: EditableDocument;
  readonly engine: RewriteEngine;
  readonly terminology?: readonly string[];
  readonly audit?: RewriteAuditSink;
  readonly onSuggestionsChange?: (suggestions: readonly RewriteSuggestion[]) => void;
}

const TONES: readonly RewriteTone[] = ["correctness", "professional", "friendly", "concise", "neutral"];

/** Generates non-destructive suggestions; callers decide when approved changes are saved. */
export function RewritePanel({ document, engine, terminology = [], audit, onSuggestionsChange }: RewritePanelProps) {
  const detected = useMemo(() => detectProtectedRanges(document.content, terminology), [document.content, terminology]);
  const [ranges, setRanges] = useState<readonly ProtectedRange[]>(detected);
  const [tone, setTone] = useState<RewriteTone>("correctness");
  const [instructions, setInstructions] = useState("");
  const [blockIndex, setBlockIndex] = useState("0");
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("0");
  const [suggestions, setSuggestions] = useState<readonly RewriteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSuggestions = (next: readonly RewriteSuggestion[]) => { setSuggestions(next); onSuggestionsChange?.(next); };
  const addProtectedRange = () => {
    try {
      const addition = createUserProtectedRange(document.content, { blockIndex: Number(blockIndex), start: Number(start), end: Number(end) });
      setRanges((current) => uniqueRanges([...current, addition])); setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add protected range."); }
  };
  const generate = async () => {
    setLoading(true); setError(null);
    try { updateSuggestions(await engine.generate({ document, instructions, tone, protectedRanges: ranges })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not generate rewrite suggestions."); }
    finally { setLoading(false); }
  };
  const decide = async (id: string, status: "accepted" | "rejected") => {
    const suggestion = suggestions.find((candidate) => candidate.id === id);
    if (suggestion === undefined) return;
    await auditSuggestionDecision(audit, status === "accepted" ? "rewrite.accept" : "rewrite.reject", suggestion);
    updateSuggestions(suggestions.map((candidate) => candidate.id === id ? { ...candidate, status } : candidate));
  };
  const acceptAll = async () => { for (const suggestion of suggestions.filter((item) => item.status === "pending")) await auditSuggestionDecision(audit, "rewrite.accept", suggestion); updateSuggestions(suggestions.map((item) => item.status === "rejected" ? item : { ...item, status: "accepted" })); };

  return <section aria-label="Rewrite assistant">
    <h2>Rewrite assistant</h2>
    <label>Mode <select aria-label="Rewrite mode" value={tone} onChange={(event) => setTone(event.target.value as RewriteTone)}>{TONES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    <label>Instructions <input aria-label="Rewrite instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} /></label>
    <h3>Protected content</h3>
    <ul>{ranges.map((range, index) => <li key={`${range.blockIndex}-${range.start}-${range.end}-${range.kind}`}><mark>{range.text}</mark> ({range.kind}) <button type="button" onClick={() => setRanges((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></li>)}</ul>
    <fieldset><legend>Add protected range</legend>
      <label>Block <input aria-label="Protected block" type="number" min="0" value={blockIndex} onChange={(event) => setBlockIndex(event.target.value)} /></label>
      <label>Start <input aria-label="Protected start" type="number" min="0" value={start} onChange={(event) => setStart(event.target.value)} /></label>
      <label>End <input aria-label="Protected end" type="number" min="1" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
      <button type="button" onClick={addProtectedRange}>Protect selection</button>
    </fieldset>
    <button type="button" onClick={generate} disabled={loading}>{loading ? "Generating…" : "Generate suggestions"}</button>
    {error !== null && <p role="alert">{error}</p>}
    {suggestions.length > 1 && <button type="button" onClick={() => void acceptAll()}>Accept all</button>}
    <ol>{suggestions.map((suggestion) => <li key={suggestion.id}>
      <p>{suggestion.reason} ({suggestion.tone}) — {suggestion.status}</p>
      <SuggestionDiff originalText={suggestion.originalText} suggestedText={suggestion.suggestedText} protectedRanges={suggestion.protectedRanges} />
      <button type="button" onClick={() => void decide(suggestion.id, "accepted")} disabled={suggestion.status !== "pending"}>Accept</button>
      <button type="button" onClick={() => void decide(suggestion.id, "rejected")} disabled={suggestion.status !== "pending"}>Reject</button>
    </li>)}</ol>
  </section>;
}
