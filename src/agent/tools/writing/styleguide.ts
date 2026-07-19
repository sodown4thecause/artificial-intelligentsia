// WRITE-012 — Style guide model.
export interface StyleGuide {
  id: string;
  name: string;
  preferredTerms: string[];
  prohibitedTerms: string[];
  capitalization: 'sentence' | 'title' | 'custom';
  productNames: Record<string, string>;
  formattingRules: string[];
  voiceInstructions: string;
  examples: string[];
  exceptionsByTeamOrDocType: Record<string, string[]>;
}

export function checkStyle(text: string, guide: StyleGuide): { prohibited: string[]; suggestions: string[] } {
  const prohibited: string[] = [];
  const suggestions: string[] = [];
  for (const term of guide.prohibitedTerms) {
    if (new RegExp(`\\b${term}\\b`, 'gi').test(text)) prohibited.push(term);
  }
  for (const term of guide.preferredTerms) {
    suggestions.push(`Prefer "${term}" where applicable.`);
  }
  return { prohibited, suggestions };
}
