import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGate1EvidenceManifest } from "../src/evidence/gate-1-manifest.js";

export async function validateGate1ManifestFile(manifestPath: string): Promise<void> {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
  } catch {
    throw new Error("Could not read a valid JSON manifest.");
  }
  parseGate1EvidenceManifest(value);
}

async function main(): Promise<void> {
  const [manifestPath, ...extraArguments] = process.argv.slice(2);
  if (!manifestPath || extraArguments.length > 0) throw new Error("Usage: npm run validate:gate-1-manifest -- <manifest-path>");
  await validateGate1ManifestFile(manifestPath);
  console.log(`Valid Gate 1 evidence manifest: ${path.basename(manifestPath)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Gate 1 manifest validation failed.");
    process.exitCode = 1;
  });
}
