const routineModels = ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-lite'];
const reasoningModels = ['anthropic/claude-sonnet-4', 'openai/gpt-4.1'];
export const defaultPolicy = {
    classification: { defaultModel: routineModels[0], allowedModels: routineModels, spendLimit: 0.01, fallbackModels: [routineModels[1]] },
    rewrite: { defaultModel: routineModels[0], allowedModels: routineModels, spendLimit: 0.02, fallbackModels: [routineModels[1]] },
    extract: { defaultModel: routineModels[0], allowedModels: routineModels, spendLimit: 0.02, fallbackModels: [routineModels[1]] },
    summarize: { defaultModel: routineModels[0], allowedModels: routineModels, spendLimit: 0.03, fallbackModels: [routineModels[1]] },
    plan: { defaultModel: reasoningModels[0], allowedModels: reasoningModels, spendLimit: 0.15, fallbackModels: [reasoningModels[1]] },
    synthesize: { defaultModel: reasoningModels[0], allowedModels: reasoningModels, spendLimit: 0.2, fallbackModels: [reasoningModels[1]] },
    draft: { defaultModel: reasoningModels[0], allowedModels: reasoningModels, spendLimit: 0.15, fallbackModels: [reasoningModels[1]] },
};
/** Applies a workspace override while retaining a valid default and fallback chain. */
export function getPolicyForTaskClass(taskClass, workspacePolicy = {}) {
    const base = defaultPolicy[taskClass];
    const defaultModel = workspacePolicy.defaultModel ?? base.defaultModel;
    const allowedModels = [...new Set(workspacePolicy.allowedModels ?? base.allowedModels)];
    const fallbackModels = [...new Set(workspacePolicy.fallbackModels ?? base.fallbackModels)]
        .filter((model) => model !== defaultModel);
    return {
        defaultModel,
        allowedModels: allowedModels.includes(defaultModel) ? allowedModels : [defaultModel, ...allowedModels],
        spendLimit: workspacePolicy.spendLimit ?? base.spendLimit,
        fallbackModels,
    };
}
//# sourceMappingURL=policy.js.map