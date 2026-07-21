import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

export type NativePlatform = "linux" | "macos" | "windows";

const extensions: Record<NativePlatform, string> = {
  linux: ".so",
  macos: ".dylib",
  windows: ".dll",
};

export function nativeLibraryFileName(platform: NativePlatform): string {
  const prefix = platform === "windows" ? "" : "lib";
  return `${prefix}creature_native${extensions[platform]}`;
}

export function nativeLibraryPath(platform: NativePlatform, repositoryRoot = process.cwd()): string {
  const outputDirectory = platform === "windows" ? "bin" : "lib";
  return path.join(repositoryRoot, "native", "zig", "zig-out", outputDirectory, nativeLibraryFileName(platform));
}

export function parsePlatform(arguments_: readonly string[]): NativePlatform {
  const index = arguments_.indexOf("--platform");
  const platform = index === -1 ? undefined : arguments_[index + 1];
  if (platform === "linux" || platform === "macos" || platform === "windows") return platform;
  throw new Error("Expected an explicit --platform argument: linux, macos, or windows.");
}

function loadThroughKoffiBridge(libraryPath: string): void {
  const require = createRequire(import.meta.url);
  const koffi = require("koffi") as {
    load(file: string): { func(signature: string): () => number };
  };
  const library = koffi.load(libraryPath);
  const initialize = library.func("int creature_native_init(void)");
  if (initialize() !== 0) throw new Error("Native bridge initialization returned a non-zero status.");
}

export function smokeNativeLibrary(platform: NativePlatform, repositoryRoot = process.cwd()): string {
  const libraryPath = nativeLibraryPath(platform, repositoryRoot);
  if (!existsSync(libraryPath)) {
    throw new Error(`Native library artifact is missing for ${platform}: ${libraryPath}`);
  }

  const hostPlatform: NativePlatform | undefined = process.platform === "darwin"
    ? "macos"
    : process.platform === "win32"
      ? "windows"
      : process.platform === "linux"
        ? "linux"
        : undefined;
  if (hostPlatform === platform) loadThroughKoffiBridge(libraryPath);
  return libraryPath;
}

function isEntrypoint(): boolean {
  return process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isEntrypoint()) {
  const platform = parsePlatform(process.argv.slice(2));
  const libraryPath = smokeNativeLibrary(platform);
  console.log(`Native library smoke passed for ${platform}: ${path.basename(libraryPath)}`);
}
