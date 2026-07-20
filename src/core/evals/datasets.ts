import type { EvalCase, EvalDataset } from "./braintrust.js";

export type BaselineEvalCategory = "drafting" | "summarization" | "grounding" | "automation-planning" | "tool-selection";

export interface BaselineEvalInput {
  task: string;
  sources?: string[];
}

export interface BaselineEvalExpected {
  requiredTerms: string[];
  forbiddenTerms?: string[];
}

export type BaselineEvalCase = EvalCase<BaselineEvalInput, BaselineEvalExpected>;

function dataset(name: BaselineEvalCategory, cases: BaselineEvalCase[]): EvalDataset<BaselineEvalInput, BaselineEvalExpected> {
  return { name, version: "1.0.0", cases };
}

export const baselineEvalDatasets: Record<BaselineEvalCategory, EvalDataset<BaselineEvalInput, BaselineEvalExpected>> = {
  drafting: dataset("drafting", [{ id: "draft-approval", input: { task: "Draft a reply confirming review, but do not promise delivery." }, expected: { requiredTerms: ["review"], forbiddenTerms: ["guarantee"] } }]),
  summarization: dataset("summarization", [{ id: "summary-open-question", input: { task: "Summarize the thread", sources: ["Decision: defer launch. Open question: owner?"] }, expected: { requiredTerms: ["defer", "owner"] } }]),
  grounding: dataset("grounding", [{ id: "grounded-citation", input: { task: "Answer using source", sources: ["Budget is $20,000."] }, expected: { requiredTerms: ["20,000"], forbiddenTerms: ["25,000"] } }]),
  "automation-planning": dataset("automation-planning", [{ id: "safe-archive-plan", input: { task: "Plan an inbox archive automation." }, expected: { requiredTerms: ["simulation", "approval"] } }]),
  "tool-selection": dataset("tool-selection", [{ id: "calendar-preview", input: { task: "Create a calendar event preview from an email." }, expected: { requiredTerms: ["calendar", "preview"], forbiddenTerms: ["send"] } }]),
};
