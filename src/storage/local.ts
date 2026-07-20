import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { DownloadedObject, MalwareScanResult, ObjectMetadata, ObjectStorage, ObjectUpload, StoredObjectId } from "./types.js";
import { assertAllowedContentType, DEFAULT_ALLOWED_CONTENT_TYPES, scanForMalware } from "./validation.js";

const OBJECT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[4-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LocalObjectStorageOptions {
  rootDirectory: string;
  allowedContentTypes?: ReadonlySet<string>;
  scan?: (content: Uint8Array, contentType: string) => Promise<MalwareScanResult>;
  now?: () => Date;
}

export class LocalObjectStorage implements ObjectStorage {
  private readonly allowedContentTypes: ReadonlySet<string>;
  private readonly scan: (content: Uint8Array, contentType: string) => Promise<MalwareScanResult>;
  private readonly now: () => Date;

  public constructor(private readonly options: LocalObjectStorageOptions) {
    this.allowedContentTypes = options.allowedContentTypes ?? DEFAULT_ALLOWED_CONTENT_TYPES;
    this.scan = options.scan ?? scanForMalware;
    this.now = options.now ?? (() => new Date());
  }

  public async upload(object: ObjectUpload): Promise<ObjectMetadata> {
    const contentType = assertAllowedContentType(object.contentType, this.allowedContentTypes);
    const scanResult = await this.scan(object.content, contentType);
    if (scanResult.status === "malicious") {
      throw new Error("Upload rejected by malware scanner");
    }

    const metadata: ObjectMetadata = {
      id: randomUUID(),
      contentType,
      size: object.content.byteLength,
      uploadedAt: this.now().toISOString(),
      sha256: createHash("sha256").update(object.content).digest("hex"),
      ...(object.fileName === undefined ? {} : { fileName: object.fileName }),
    };
    const objectPath = this.objectPath(metadata.id);
    const metadataPath = this.metadataPath(metadata.id);
    await mkdir(dirname(objectPath), { recursive: true });
    await this.writeAtomically(objectPath, object.content);
    try {
      await this.writeAtomically(metadataPath, JSON.stringify(metadata));
    } catch (error) {
      await rm(objectPath, { force: true });
      throw error;
    }
    return metadata;
  }

  public async download(id: StoredObjectId): Promise<DownloadedObject> {
    const metadata = await this.getMetadata(id);
    const content = await readFile(this.objectPath(id));
    return { content, metadata };
  }

  public async delete(id: StoredObjectId): Promise<void> {
    this.assertObjectId(id);
    await Promise.all([
      rm(this.objectPath(id), { force: true }),
      rm(this.metadataPath(id), { force: true }),
    ]);
  }

  public async getMetadata(id: StoredObjectId): Promise<ObjectMetadata> {
    this.assertObjectId(id);
    try {
      const metadata = JSON.parse(await readFile(this.metadataPath(id), "utf8")) as ObjectMetadata;
      this.assertMetadata(metadata, id);
      await stat(this.objectPath(id));
      return metadata;
    } catch (error) {
      if (this.isMissingFile(error)) {
        throw new Error("Stored object not found");
      }
      throw error;
    }
  }

  private objectPath(id: StoredObjectId): string {
    this.assertObjectId(id);
    return join(this.options.rootDirectory, "objects", `${id}.bin`);
  }

  private metadataPath(id: StoredObjectId): string {
    this.assertObjectId(id);
    return join(this.options.rootDirectory, "metadata", `${id}.json`);
  }

  private async writeAtomically(path: string, content: Uint8Array | string): Promise<void> {
    const temporaryPath = `${path}.${randomUUID()}.tmp`;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(temporaryPath, content);
    await rename(temporaryPath, path);
  }

  private assertObjectId(id: string): void {
    if (!OBJECT_ID_PATTERN.test(id)) {
      throw new Error("Invalid stored object identifier");
    }
  }

  private assertMetadata(metadata: ObjectMetadata, expectedId: string): void {
    if (
      !metadata ||
      metadata.id !== expectedId ||
      typeof metadata.contentType !== "string" ||
      !Number.isSafeInteger(metadata.size) ||
      metadata.size < 0 ||
      typeof metadata.uploadedAt !== "string" ||
      !/^[a-f0-9]{64}$/.test(metadata.sha256)
    ) {
      throw new Error("Stored object metadata is invalid");
    }
    assertAllowedContentType(metadata.contentType, this.allowedContentTypes);
  }

  private isMissingFile(error: unknown): error is NodeJS.ErrnoException {
    return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
  }
}
