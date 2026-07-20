import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { LocalObjectStorage } from "../../src/storage/local.js";
import { SecureLinkService } from "../../src/storage/secure-link.js";

test("stores validated objects without exposing a filesystem location", async () => {
  const directory = await mkdtemp(join(tmpdir(), "creature-storage-"));
  try {
    const storage = new LocalObjectStorage({ rootDirectory: directory });
    const uploaded = await storage.upload({
      content: new TextEncoder().encode("private attachment"),
      contentType: "text/plain",
      fileName: "notes.txt",
    });
    const downloaded = await storage.download(uploaded.id);

    assert.equal(new TextDecoder().decode(downloaded.content), "private attachment");
    assert.deepEqual(Object.keys(uploaded).sort(), ["contentType", "fileName", "id", "sha256", "size", "uploadedAt"]);
    assert.ok(!JSON.stringify(uploaded).includes(directory));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects unsupported content types and malware scanner rejections", async () => {
  const directory = await mkdtemp(join(tmpdir(), "creature-storage-"));
  try {
    const storage = new LocalObjectStorage({ rootDirectory: directory });
    await assert.rejects(storage.upload({ content: new Uint8Array(), contentType: "application/x-msdownload" }), /Unsupported content type/);

    const scannedStorage = new LocalObjectStorage({
      rootDirectory: directory,
      scan: async () => ({ status: "malicious" }),
    });
    await assert.rejects(scannedStorage.upload({ content: new Uint8Array(), contentType: "text/plain" }), /malware scanner/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("secure download links are signed and expire", () => {
  let now = new Date("2026-07-20T12:00:00.000Z");
  const links = new SecureLinkService({
    baseUrl: "https://creature.test/download",
    signingKey: "test-signing-key",
    now: () => now,
  });
  const objectId = "123e4567-e89b-42d3-a456-426614174000";
  const link = links.create(objectId, 60);

  assert.equal(links.verify(link.url)?.objectId, objectId);
  assert.ok(!link.url.includes("objects") && !link.url.includes(".bin"));
  now = new Date("2026-07-20T12:01:00.000Z");
  assert.equal(links.verify(link.url), undefined);
});
