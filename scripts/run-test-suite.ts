import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const suiteDirectories = {
  all: "test",
  unit: "test/unit",
  contract: "test/contract",
  eval: "test/eval",
  e2e: "test/e2e",
  redteam: "test/redteam",
} as const;
const testFilePattern = /\.test\.tsx?$/;

type Suite = keyof typeof suiteDirectories;

const testRunnerOptionsWithValues = new Set([
  "--test-concurrency",
  "--test-coverage-branches",
  "--test-coverage-exclude",
  "--test-coverage-functions",
  "--test-coverage-include",
  "--test-coverage-lines",
  "--test-global-setup",
  "--test-isolation",
  "--test-name-pattern",
  "--test-reporter",
  "--test-reporter-destination",
  "--test-rerun-failures",
  "--test-shard",
  "--test-skip-pattern",
  "--test-timeout",
]);

function parseSuiteArguments(arguments_: string[]): { suite: Suite; testRunnerOptions: string[] } {
  const [suite, ...testRunnerArguments] = arguments_;

  if (!Object.hasOwn(suiteDirectories, suite)) {
    throw new Error(`Unknown test suite: ${suite}.`);
  }

  const testRunnerOptions: string[] = [];
  let expectsValueFor: string | undefined;

  for (const argument of testRunnerArguments) {
    if (Object.hasOwn(suiteDirectories, argument)) {
      throw new Error(`Expected one test suite argument; received an additional suite: ${argument}.`);
    }

    if (expectsValueFor) {
      if (argument.startsWith("-")) {
        throw new Error(`Expected a value for ${expectsValueFor}.`);
      }

      testRunnerOptions.push(argument);
      expectsValueFor = undefined;
      continue;
    }

    if (!argument.startsWith("-") || argument === "--") {
      throw new Error(`Expected a Node test-runner option, received: ${argument}.`);
    }

    testRunnerOptions.push(argument);

    if (!argument.includes("=") && testRunnerOptionsWithValues.has(argument)) {
      expectsValueFor = argument;
    }
  }

  if (expectsValueFor) {
    throw new Error(`Expected a value for ${expectsValueFor}.`);
  }

  return { suite: suite as Suite, testRunnerOptions };
}

async function findTestFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await findTestFiles(path));
    } else if (entry.isFile() && testFilePattern.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

const { suite, testRunnerOptions } = parseSuiteArguments(process.argv.slice(2));
const files = await findTestFiles(join(rootDirectory, suiteDirectories[suite]));

if (files.length === 0) {
  throw new Error(`No test files were found for suite: ${suite}.`);
}

console.log(`Running ${files.length} ${suite} test files.`);

const exitCode = await new Promise<number>((resolveExitCode, reject) => {
  const testProcess = spawn(
    process.execPath,
    ["--import", "tsx", "--test", ...testRunnerOptions, ...files],
    { cwd: rootDirectory, shell: false, stdio: "inherit" },
  );

  testProcess.once("error", reject);
  testProcess.once("exit", (code) => resolveExitCode(code ?? 1));
});

process.exitCode = exitCode;

if (exitCode !== 0) {
  console.error(`${suite} tests failed with exit code ${exitCode}.`);
}
