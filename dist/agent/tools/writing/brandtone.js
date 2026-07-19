export class BrandTone {
    id;
    name;
    versions = [];
    currentVersion = 0;
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
    define(examples, guidance) {
        const version = { version: this.versions.length + 1, examples, guidance, approvedAt: Date.now() };
        this.versions.push(version);
        this.currentVersion = version.version;
        return version;
    }
    /** Approved content is frozen at its snapshot version; new versions never mutate it. */
    snapshotFor(version) {
        return this.versions.find((v) => v.version === version);
    }
    get current() {
        return this.versions.find((v) => v.version === this.currentVersion);
    }
}
//# sourceMappingURL=brandtone.js.map