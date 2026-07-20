export const supportedDesktopPlatforms = ["win32", "darwin", "linux"] as const;

export type SupportedDesktopPlatform = (typeof supportedDesktopPlatforms)[number];

export const criticalDesktopFlowManifest = [
  "email-to-work",
  "document-improvement",
  "approval-resume",
  "automation-simulate-apply-reverse",
] as const;

export type CriticalDesktopFlow = (typeof criticalDesktopFlowManifest)[number];

/**
 * Selects the deterministic flow suite for a supported desktop platform.
 * Native package and keyring smoke checks are intentionally outside this suite.
 */
export function criticalDesktopFlowsFor(platform: SupportedDesktopPlatform): readonly CriticalDesktopFlow[] {
  return criticalDesktopFlowManifest;
}
