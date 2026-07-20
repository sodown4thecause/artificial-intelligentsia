import { useEffect, useState } from "react";

import type { DurableRun, DurableSessionRuntime, RunStatus } from "../../agent/runtime.js";

export type InboxCategory = "input" | "approval" | "failure" | "completed";

export interface InboxItem {
  readonly run: DurableRun;
  readonly category: InboxCategory;
  readonly summary: string;
  readonly nextAction: string;
}

export interface InboxGroups {
  readonly input: readonly InboxItem[];
  readonly approval: readonly InboxItem[];
  readonly failure: readonly InboxItem[];
  readonly completed: readonly InboxItem[];
}

const categories: Readonly<Record<InboxCategory, readonly RunStatus[]>> = {
  input: ["waiting", "paused"], approval: ["approval_required"], failure: ["failed", "cancelled"], completed: ["completed"],
};

function categoryFor(status: RunStatus): InboxCategory | undefined {
  return (Object.keys(categories) as InboxCategory[]).find((category) => categories[category].includes(status));
}

function latestOutput(run: DurableRun): string | undefined {
  const value = run.partialOutputs.at(-1)?.value ?? run.checkpoints.at(-1)?.output;
  if (typeof value === "string") return value;
  return value === undefined ? undefined : "Latest work is available to review.";
}

export function getInboxGroups(runs: readonly DurableRun[]): InboxGroups {
  const groups: { [Category in InboxCategory]: InboxItem[] } = { input: [], approval: [], failure: [], completed: [] };
  for (const run of runs) {
    const category = categoryFor(run.status);
    if (category === undefined) continue;
    const summary = latestOutput(run) ?? run.error ?? run.task;
    const nextAction = category === "input" ? "Open task and provide the requested input."
      : category === "approval" ? "Review the pending step and approve it to continue."
      : category === "failure" ? (run.status === "cancelled" ? "Review the cancelled task or dismiss it." : "Review the error and retry when ready.")
      : "Review the completed work.";
    groups[category].push({ run, category, summary, nextAction });
  }
  for (const group of Object.values(groups)) group.sort((left, right) => right.run.updatedAt.localeCompare(left.run.updatedAt));
  return groups;
}

const emptyGroups = (): InboxGroups => ({ input: [], approval: [], failure: [], completed: [] });

export function useInbox(runtime: DurableSessionRuntime): InboxGroups {
  const [runs, setRuns] = useState<readonly DurableRun[]>([]);
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void Promise.resolve(runtime.listRuns()).then((loadedRuns) => {
      if (!active) return;
      setRuns(loadedRuns);
      const subscriptions = loadedRuns.map((run) => runtime.subscribe(run.id, (updated) => {
        setRuns((current) => current.map((item) => item.id === updated.id ? updated : item));
      }));
      unsubscribe = () => subscriptions.forEach((subscription) => subscription());
    });
    return () => { active = false; unsubscribe?.(); };
  }, [runtime]);
  return runs.length === 0 ? emptyGroups() : getInboxGroups(runs);
}
