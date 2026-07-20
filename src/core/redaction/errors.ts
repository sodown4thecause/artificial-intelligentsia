import { redactSecrets } from "./secrets.js";

export class RedactedError extends Error {
  readonly cause: unknown;

  constructor(error: unknown, fallbackMessage = "An unexpected error occurred") {
    super(redactErrorMessage(error, fallbackMessage));
    this.name = "RedactedError";
    this.cause = error;
  }
}

/** Extracts a safe message for display without exposing credentials in error text. */
export function redactErrorMessage(error: unknown, fallbackMessage = "An unexpected error occurred"): string {
  if (typeof error === "string") return redactSecrets(error);
  if (error instanceof Error) return redactSecrets(error.message);
  return fallbackMessage;
}

/** Wraps arbitrary failures before they are presented to a user. */
export function redactError(error: unknown, fallbackMessage?: string): RedactedError {
  return error instanceof RedactedError ? error : new RedactedError(error, fallbackMessage);
}
