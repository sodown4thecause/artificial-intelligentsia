export interface ResearchFinding {
  claim: string;
  sourceIds: string[];
  kind: "fact" | "inference" | "recommendation";
}

export interface Researcher {
  investigate(query: string): Promise<ResearchFinding[]>;
}

/** Interface boundary for the research subagent; connector-backed search is registered later. */
export const createResearcher = (): Researcher => ({
  async investigate(): Promise<ResearchFinding[]> {
    return [];
  },
});
