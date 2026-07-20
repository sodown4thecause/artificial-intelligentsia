import assert from "node:assert/strict";
import test from "node:test";
import { RedactedError, redactError, redactErrorMessage } from "../../src/core/redaction/errors.js";
import { REDACTED_SECRET, containsSecret, redactSecrets } from "../../src/core/redaction/secrets.js";

test("redacts secrets from prompts and logs", () => {
  const prompt = "Use api_key=FAKE_API_KEY_VALUE_abcdefghijklmnopqrstuvwxyz and password: hunter2";
  const log = "Authorization: Bearer FAKE_BEARER_TOKEN_abcdefghijklmnopqrstuvwxyz123456";

  assert.equal(redactSecrets(prompt), `Use api_key=${REDACTED_SECRET} and password: ${REDACTED_SECRET}`);
  assert.equal(redactSecrets(log), `Authorization: ${REDACTED_SECRET}`);
  assert.equal(containsSecret(prompt), true);
});

test("redacts private keys and token formats", () => {
  const privateKey = "-----BEGIN PRIVATE KEY-----\nsecret-key-material\n-----END PRIVATE KEY-----";
  const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature-value";

  assert.equal(redactSecrets(privateKey), REDACTED_SECRET);
  assert.equal(redactSecrets(jwt), REDACTED_SECRET);
});

test("wraps user-visible error messages with redaction", () => {
  const source = new Error("Request failed with access_token=top-secret-token");
  const wrapped = redactError(source);

  assert.ok(wrapped instanceof RedactedError);
  assert.equal(wrapped.message, `Request failed with access_token=${REDACTED_SECRET}`);
  assert.equal(redactErrorMessage("password=hunter2"), `password=${REDACTED_SECRET}`);
  assert.equal(wrapped.cause, source);
});
