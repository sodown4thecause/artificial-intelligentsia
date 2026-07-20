/** Opaque identifier for a stored object. It must never be a filesystem path. */
export type StoredObjectId = string;

export interface ObjectUpload {
  content: Uint8Array;
  contentType: string;
  fileName?: string;
}

export interface ObjectMetadata {
  id: StoredObjectId;
  contentType: string;
  size: number;
  uploadedAt: string;
  sha256: string;
  fileName?: string;
}

export interface DownloadedObject {
  content: Uint8Array;
  metadata: ObjectMetadata;
}

/**
 * Storage boundary used by the application. Implementations deliberately do
 * not return provider keys, bucket names, or filesystem locations.
 */
export interface ObjectStorage {
  upload(object: ObjectUpload): Promise<ObjectMetadata>;
  download(id: StoredObjectId): Promise<DownloadedObject>;
  delete(id: StoredObjectId): Promise<void>;
  getMetadata(id: StoredObjectId): Promise<ObjectMetadata>;
}

export interface SecureDownloadLink {
  url: string;
  expiresAt: string;
}

export interface VerifiedDownloadLink {
  objectId: StoredObjectId;
  expiresAt: string;
}

export type MalwareScanStatus = "not-scanned" | "clean" | "malicious";

export interface MalwareScanResult {
  status: MalwareScanStatus;
  detail?: string;
}
