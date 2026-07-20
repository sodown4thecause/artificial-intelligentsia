import { useCallback, useState } from "react";
import { applySuggestions, type RewriteApplyContext } from "../../rewrites/apply.js";
import { RewriteEngine } from "../../rewrites/engine.js";
import type { RewriteGenerationInput, RewriteSuggestion } from "../../rewrites/types.js";

/** State and commands shared by rewrite surfaces that need an explicit apply step. */
export function useRewrite(engine: RewriteEngine, applyContext?: RewriteApplyContext) {
  const [suggestions, setSuggestions] = useState<readonly RewriteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (input: RewriteGenerationInput) => {
    setLoading(true); setError(null);
    try {
      const next = await engine.generate(input);
      setSuggestions(next);
      return next;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not generate rewrite suggestions.";
      setError(message);
      throw reason;
    } finally { setLoading(false); }
  }, [engine]);

  const decide = useCallback((id: string, status: "accepted" | "rejected") => {
    setSuggestions((current) => current.map((suggestion) => suggestion.id === id ? { ...suggestion, status } : suggestion));
  }, []);

  const applyAccepted = useCallback(async (expectedVersion: number) => {
    if (applyContext === undefined) throw new Error("Rewrite application is not configured.");
    setLoading(true); setError(null);
    try {
      const saved = await applySuggestions(applyContext, suggestions, expectedVersion);
      setSuggestions([]);
      return saved;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not apply rewrite suggestions.";
      setError(message);
      throw reason;
    } finally { setLoading(false); }
  }, [applyContext, suggestions]);

  return { suggestions, loading, error, generate, decide, applyAccepted };
}
