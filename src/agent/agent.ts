import { DurableSessionRuntime, NativeCacheRunStore } from "./runtime.js";

export const creatureModelPolicy = {
  routine: "gateway/default-low-cost",
  complex: "gateway/default-high-capability",
  highImpactDraft: "gateway/default-high-capability",
} as const;

/** Creates the Eve-compatible runtime boundary used by Creature's agent surfaces. */
export const createCreatureAgentRuntime = (): DurableSessionRuntime =>
  new DurableSessionRuntime(new NativeCacheRunStore());
