import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

export type NativeEvidencePlatform = "linux" | "macos" | "windows";

export interface NativeBuildEvidenceOptions {
  platform: NativeEvidencePlatform;
  libraryPath: string;
  outputPath: string;
}

export interface NativeBuildEvidence {
  platform: NativeEvidencePlatform;
  library: string;
  sha256: string;
  sizeBytes: number;
  librarySmoke: "passed";
  fallbackMode: false;
}

function assertNativeLibrary(libraryPath: string): void {
  if (!existsSync(libraryPath)) throw new Error(`Native library artifact is missing: ${libraryPath}`);
  const stats = statSync(libraryPath);
  if (!stats.isFile() || stats.size === 0) throw new Error(`Native library artifact is not a non-empty file: ${libraryPath}`);
}

export function writeNativeBuildEvidence(options: NativeBuildEvidenceOptions): NativeBuildEvidence {
  assertNativeLibrary(options.libraryPath);
  const libraryBytes = readFileSync(options.libraryPath);
  const checksum = createHash("sha256").update(libraryBytes).digest("hex");
  const checksumPath = `${options.libraryPath}.sha256`;
  const evidence: NativeBuildEvidence = {
    platform: options.platform,
    library: path.basename(options.libraryPath),
    sha256: checksum,
    sizeBytes: libraryBytes.length,
    librarySmoke: "passed",
    fallbackMode: false,
  };

  mkdirSync(path.dirname(options.outputPath), { recursive: true });
  writeFileSync(checksumPath, `${checksum}  ${path.basename(options.libraryPath)}\n`, "utf8");
  writeFileSync(options.outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

  if (!existsSync(checksumPath) || !existsSync(options.outputPath)) {
    throw new Error("Native evidence artifact generation did not produce all required files.");
  }
  return evidence;
}

function parseArgument(arguments_: readonly string[], name: string): string {
  const index = arguments_.indexOf(name);
  const value = index === -1 ? undefined : arguments_[index + 1];
  if (value === undefined || value.startsWith("--")) throw new Error(`Expected ${name} argument.`);
  return value;
}

export function parseNativeEvidenceArguments(arguments_: readonly string[]): NativeBuildEvidenceOptions {
  const platform = parseArgument(arguments_, "--platform");
  if (platform !== "linux" && platform !== "macos" && platform !== "windows") {
    throw new Error("Expected --platform to be linux, macos, or windows.");
  }
  if (parseArgument(arguments_, "--smoke-passed") !== "true") {
    throw new Error("Evidence generation requires --smoke-passed true; fallback mode cannot succeed.");
  }
  return {
    platform,
    libraryPath: parseArgument(arguments_, "--library"),
    outputPath: parseArgument(arguments_, "--output"),
  };
}

if (process.argv[1]?.endsWith("native-build-evidence.ts")) {
  const evidence = writeNativeBuildEvidence(parseNativeEvidenceArguments(process.argv.slice(2)));
  console.log(`Native evidence written for ${evidence.platform}: ${evidence.library}`);
}
