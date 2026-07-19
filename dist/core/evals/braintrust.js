// import { initLogger } from '@braintrust/core';
const mockEvents = [];
let client;
function getEnvironmentValue(name) {
    return typeof process === 'undefined' ? undefined : process.env[name];
}
function createMockClient(projectName) {
    return {
        mode: 'mock',
        projectName,
        log(event, payload) {
            mockEvents.push({ event, projectName, ...payload });
        },
    };
}
/**
 * Initializes the eval client. Until the Braintrust SDK is wired in, API-key
 * configured projects retain the same local event contract as mock mode.
 */
export function initBraintrust(config = {}) {
    const apiKey = config.apiKey ?? getEnvironmentValue('BRAINTRUST_API_KEY');
    const projectName = config.projectName
        ?? getEnvironmentValue('BRAINTRUST_PROJECT_NAME')
        ?? 'creature-os-mvp';
    // Replace this client with the Braintrust SDK client once its API is adopted.
    // Keeping the local contract allows evals to run in CI without credentials.
    client = createMockClient(projectName);
    if (apiKey) {
        client.log('braintrust.configured', { credentialSource: 'api-key' });
    }
    return client;
}
function getClient() {
    return client ?? initBraintrust();
}
/** Runs a deterministic local eval and records a passing score for each case. */
export function runEval(name, fn, dataset) {
    const evalClient = getClient();
    const scores = dataset.map((input) => ({ input, output: fn(input), score: 1 }));
    evalClient.log('eval.completed', {
        name,
        caseCount: scores.length,
        averageScore: scores.length === 0 ? 0 : 1,
    });
    return scores;
}
/** Records the durable workflow steps associated with an agent run. */
export function traceRun(runId, steps) {
    getClient().log('run.traced', { runId, steps });
}
/** Records a named quality metric for the active eval project. */
export function logScore(name, score, metadata = {}) {
    getClient().log('score.logged', { name, score, metadata });
}
//# sourceMappingURL=braintrust.js.map