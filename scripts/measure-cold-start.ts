import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  COLD_START_TARGET_MS,
  measureDesktopBootstrap,
} from "../src/desktop/lifecycle.js";

type BootstrapModule = {
  bootstrapDesktop?: () => Promise<void>;
};

function parseArguments(arguments_: readonly string[]): string | undefined {
  const commandIndex = arguments_.indexOf("--module");
  return commandIndex === -1 ? undefined : arguments_[commandIndex + 1];
}

function resolveModulePath(modulePath: string): string {
  if (/^[a-z]+:/i.test(modulePath)) {
    return modulePath;
  }

  return pathToFileURL(resolve(process.cwd(), modulePath)).href;
}

const modulePath = parseArguments(process.argv.slice(2));

if (!modulePath) {
  console.error(
    "Usage: tsx scripts/measure-cold-start.ts --module <desktop-bootstrap-module>",
  );
  console.error("The module must export async bootstrapDesktop().");
  process.exitCode = 1;
} else {
  const bootstrapModule = (await import(
    resolveModulePath(modulePath),
  )) as BootstrapModule;
  if (!bootstrapModule.bootstrapDesktop) {
    throw new Error(`Module ${modulePath} does not export bootstrapDesktop().`);
  }

  const durationMs = await measureDesktopBootstrap(bootstrapModule.bootstrapDesktop);
  const status = durationMs < COLD_START_TARGET_MS ? "PASS" : "FAIL";
  console.log(
    JSON.stringify({
      metric: "desktop-bootstrap",
      durationMs: Number(durationMs.toFixed(2)),
      targetMs: COLD_START_TARGET_MS,
      status,
    }),
  );

  if (status === "FAIL") {
    process.exitCode = 2;
  }
}
