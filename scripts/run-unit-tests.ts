import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const unitTestDirectory = join(rootDirectory, "test", "unit");
const unitTestPattern = /\.test\.tsx?$/;

async function findUnitTestFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) => {
    if (left.name < right.name) return -1;
    if (left.name > right.name) return 1;
    return 0;
  })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await findUnitTestFiles(path));
    } else if (entry.isFile() && unitTestPattern.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

const files = await findUnitTestFiles(unitTestDirectory);

if (files.length === 0) {
  throw new Error("No unit test files were found.");
}

console.log(`Running ${files.length} unit test files.`);

const testProcess = spawn(
  process.execPath,
  ["--import", "tsx", "--test", ...files],
  { cwd: rootDirectory, shell: false, stdio: "inherit" },
);

testProcess.once("error", (error) => {
  throw error;
});

const exitCode = await new Promise<number>((resolveExitCode) => {
  testProcess.once("exit", (code) => resolveExitCode(code ?? 1));
});

process.exitCode = exitCode;

if (exitCode !== 0) {
  console.error(`Unit tests failed with exit code ${exitCode}.`);
}
