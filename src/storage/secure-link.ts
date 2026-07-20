import { createHmac, timingSafeEqual } from "node:crypto";
import type { SecureDownloadLink, StoredObjectId, VerifiedDownloadLink } from "./types.js";

export interface SecureLinkServiceOptions {
  baseUrl: string;
  signingKey: string | Uint8Array;
  now?: () => Date;
}

export class SecureLinkService {
  private readonly baseUrl: URL;
  private readonly now: () => Date;

  public constructor(private readonly options: SecureLinkServiceOptions) {
    this.baseUrl = new URL(options.baseUrl);
    this.now = options.now ?? (() => new Date());
  }

  public create(objectId: StoredObjectId, expiresInSeconds: number): SecureDownloadLink {
    this.assertObjectId(objectId);
    if (!Number.isSafeInteger(expiresInSeconds) || expiresInSeconds <= 0) {
      throw new Error("Link expiry must be a positive number of seconds");
    }
    const expiresAt = new Date(this.now().getTime() + expiresInSeconds * 1_000);
    const expires = Math.floor(expiresAt.getTime() / 1_000);
    const url = new URL(this.baseUrl);
    url.pathname = `${url.pathname.replace(/\/$/, "")}/${encodeURIComponent(objectId)}`;
    url.searchParams.set("expires", String(expires));
    url.searchParams.set("signature", this.sign(objectId, expires));
    return { url: url.toString(), expiresAt: expiresAt.toISOString() };
  }

  public verify(url: string): VerifiedDownloadLink | undefined {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return undefined;
    }
    if (parsed.origin !== this.baseUrl.origin) {
      return undefined;
    }
    const basePath = this.baseUrl.pathname.replace(/\/$/, "");
    if (!parsed.pathname.startsWith(`${basePath}/`)) {
      return undefined;
    }
    const objectId = decodeURIComponent(parsed.pathname.slice(basePath.length + 1));
    const expires = Number(parsed.searchParams.get("expires"));
    const signature = parsed.searchParams.get("signature");
    if (!this.isObjectId(objectId) || !Number.isSafeInteger(expires) || !signature || expires <= Math.floor(this.now().getTime() / 1_000)) {
      return undefined;
    }
    const expected = this.sign(objectId, expires);
    const received = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expected, "base64url");
    if (received.length !== expectedBuffer.length || !timingSafeEqual(received, expectedBuffer)) {
      return undefined;
    }
    return { objectId, expiresAt: new Date(expires * 1_000).toISOString() };
  }

  private sign(objectId: StoredObjectId, expires: number): string {
    return createHmac("sha256", this.options.signingKey).update(`${objectId}:${expires}`).digest("base64url");
  }

  private assertObjectId(id: string): void {
    if (!this.isObjectId(id)) {
      throw new Error("Invalid stored object identifier");
    }
  }

  private isObjectId(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[4-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }
}
