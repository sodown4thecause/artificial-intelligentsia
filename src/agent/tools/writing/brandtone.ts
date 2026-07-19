// WRITE-013 — Brand tones: reusable, versioned; changes must not silently alter approved content.
export interface BrandToneVersion {
  version: number;
  examples: string[];
  guidance: string;
  approvedAt: number;
}

export class BrandTone {
  id: string;
  name: string;
  versions: BrandToneVersion[] = [];
  currentVersion = 0;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  define(examples: string[], guidance: string): BrandToneVersion {
    const version: BrandToneVersion = { version: this.versions.length + 1, examples, guidance, approvedAt: Date.now() };
    this.versions.push(version);
    this.currentVersion = version.version;
    return version;
  }

  /** Approved content is frozen at its snapshot version; new versions never mutate it. */
  snapshotFor(version: number): BrandToneVersion | undefined {
    return this.versions.find((v) => v.version === version);
  }

  get current(): BrandToneVersion | undefined {
    return this.versions.find((v) => v.version === this.currentVersion);
  }
}
