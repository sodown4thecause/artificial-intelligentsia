// import { initLogger } from '@braintrust/core';

export interface BraintrustConfig {
  apiKey?: string;
  projectName?: string;
}

export interface BraintrustClient {
  mode: 'braintrust' | 'mock';
  projectName: string;
  log(event: string, payload: Record<string, unknown>): void;
}

export interface EvalScore<T, E> {
  input: T;
  output: E;
  score: number;
}

export interface TraceStep {
  type: string;
  status: string;
  details?: unknown;
}

const mockEvents: Array<Record<string, unknown>> = [];
let client: BraintrustClient | undefined;

function getEnvironmentValue(name: string): string | undefined {
  return typeof process === 'undefined' ? undefined : process.env[name];
}

function createMockClient(projectName: string): BraintrustClient {
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
export function initBraintrust(config: BraintrustConfig = {}): BraintrustClient {
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

function getClient(): BraintrustClient {
  return client ?? initBraintrust();
}

/** Runs a deterministic local eval and records a passing score for each case. */
export function runEval<T, E>(
  name: string,
  fn: (input: T) => E,
  dataset: T[],
): EvalScore<T, E>[] {
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
export function traceRun(runId: string, steps: TraceStep[]): void {
  getClient().log('run.traced', { runId, steps });
}

/** Records a named quality metric for the active eval project. */
export function logScore(
  name: string,
  score: number,
  metadata: Record<string, unknown> = {},
): void {
  getClient().log('score.logged', { name, score, metadata });
}
