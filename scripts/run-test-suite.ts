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

function parseSuiteArgument(arguments_: string[]): Suite {
  if (arguments_.length !== 1) {
    throw new Error("Expected exactly one test suite argument.");
  }

  const [suite] = arguments_;

  if (!Object.hasOwn(suiteDirectories, suite)) {
    throw new Error(`Unknown test suite: ${suite}.`);
  }

  return suite as Suite;
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

const suite = parseSuiteArgument(process.argv.slice(2));
const files = await findTestFiles(join(rootDirectory, suiteDirectories[suite]));

if (files.length === 0) {
  throw new Error(`No test files were found for suite: ${suite}.`);
}

console.log(`Running ${files.length} ${suite} test files.`);

const exitCode = await new Promise<number>((resolveExitCode, reject) => {
  const testProcess = spawn(
    process.execPath,
    ["--import", "tsx", "--test", ...files],
    { cwd: rootDirectory, shell: false, stdio: "inherit" },
  );

  testProcess.once("error", reject);
  testProcess.once("exit", (code) => resolveExitCode(code ?? 1));
});

process.exitCode = exitCode;

if (exitCode !== 0) {
  console.error(`${suite} tests failed with exit code ${exitCode}.`);
}
