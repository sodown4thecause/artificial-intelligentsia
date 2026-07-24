/** Engineering-default Gate 1 evidence policy. Security and Release Owner review is tracked separately. */
export const gate1EvidenceTypes = Object.freeze([
  "native-library", "desktop-directory-package", "installer", "credential-round-trip", "signing-notarization", "cold-start", "durable-resume", "language-quality", "product-journey", "eve", "ai-sdk-7", "vercel-connect", "gmail", "calendar", "human-observation", "rollback", "sign-off",
] as const);

export type Gate1EvidenceType = typeof gate1EvidenceTypes[number];
export const gate1Classifications = Object.freeze(["public", "internal", "confidential", "restricted"] as const);
export const gate1AccessScopes = Object.freeze(["public", "maintainers", "release-engineering", "security-release", "incident-response"] as const);
export const gate1StorageLocations = Object.freeze(["repository", "circleci", "github-release", "encrypted-evidence-store"] as const);
export const gate1RedactionProfiles = Object.freeze(["none", "gate1-secrets-v1", "gate1-provider-v1", "gate1-human-v1"] as const);
export const gate1RetentionPolicies = Object.freeze(["ci-30d", "internal-90d", "human-90d", "release-365d", "release-lifetime", "incident-7y-or-legal-hold"] as const);
export const gate1OwnerRoles = Object.freeze(["maintainers", "release-engineering", "security-release", "incident-response"] as const);
export const gate1LifecycleStates = Object.freeze(["active", "quarantined", "deleted"] as const);

export type Gate1Classification = typeof gate1Classifications[number];
export type Gate1AccessScope = typeof gate1AccessScopes[number];
export type Gate1StorageLocation = typeof gate1StorageLocations[number];
export type Gate1RedactionProfile = typeof gate1RedactionProfiles[number];
export type Gate1RetentionPolicy = typeof gate1RetentionPolicies[number];
export type Gate1OwnerRole = typeof gate1OwnerRoles[number];

type EvidenceGovernancePolicy = {
  readonly minimumClassification: Gate1Classification;
  readonly accessScopes: readonly Gate1AccessScope[];
  readonly storageLocations: readonly Gate1StorageLocation[];
  readonly githubReleaseRoles: readonly ("package" | "signature")[];
  readonly redactionProfile: Gate1RedactionProfile;
  readonly redactionStatus: "redacted" | "not-required";
  readonly retentionPolicies: readonly Gate1RetentionPolicy[];
  readonly ownerRoles: readonly Gate1OwnerRole[];
  readonly syntheticData: "required" | "forbidden" | "synthetic-or-consent";
  readonly consent: "none" | "when-not-synthetic" | "required";
};

function freezePolicy(policy: Record<Gate1EvidenceType, EvidenceGovernancePolicy>): Readonly<Record<Gate1EvidenceType, EvidenceGovernancePolicy>> {
  for (const row of Object.values(policy)) {
    Object.freeze(row.accessScopes);
    Object.freeze(row.storageLocations);
    Object.freeze(row.githubReleaseRoles);
    Object.freeze(row.retentionPolicies);
    Object.freeze(row.ownerRoles);
    Object.freeze(row);
  }
  return Object.freeze(policy);
}

const internalSynthetic = {
  minimumClassification: "internal", accessScopes: ["maintainers"], storageLocations: ["repository", "circleci", "encrypted-evidence-store"], githubReleaseRoles: [], redactionProfile: "none", redactionStatus: "not-required", retentionPolicies: ["ci-30d", "internal-90d"], ownerRoles: ["maintainers"], syntheticData: "required", consent: "none",
} as const;

const releaseArtifact = {
  minimumClassification: "confidential", accessScopes: ["release-engineering", "security-release"], storageLocations: ["circleci", "github-release", "encrypted-evidence-store"], githubReleaseRoles: ["package", "signature"], redactionProfile: "none", redactionStatus: "not-required", retentionPolicies: ["release-365d", "release-lifetime"], ownerRoles: ["release-engineering", "security-release"], syntheticData: "required", consent: "none",
} as const;

export const gate1EvidenceGovernancePolicy = freezePolicy({
  "native-library": internalSynthetic,
  "desktop-directory-package": releaseArtifact,
  installer: releaseArtifact,
  "credential-round-trip": { minimumClassification: "restricted", accessScopes: ["security-release"], storageLocations: ["encrypted-evidence-store"], githubReleaseRoles: [], redactionProfile: "gate1-secrets-v1", redactionStatus: "redacted", retentionPolicies: ["ci-30d"], ownerRoles: ["security-release"], syntheticData: "required", consent: "none" },
  "signing-notarization": releaseArtifact,
  "cold-start": internalSynthetic,
  "durable-resume": internalSynthetic,
  "language-quality": internalSynthetic,
  "product-journey": internalSynthetic,
  eve: { minimumClassification: "restricted", accessScopes: ["security-release"], storageLocations: ["encrypted-evidence-store"], githubReleaseRoles: [], redactionProfile: "gate1-provider-v1", redactionStatus: "redacted", retentionPolicies: ["ci-30d"], ownerRoles: ["security-release"], syntheticData: "synthetic-or-consent", consent: "when-not-synthetic" },
  "ai-sdk-7": { minimumClassification: "restricted", accessScopes: ["security-release"], storageLocations: ["encrypted-evidence-store"], githubReleaseRoles: [], redactionProfile: "gate1-provider-v1", redactionStatus: "redacted", retentionPolicies: ["ci-30d"], ownerRoles: ["security-release"], syntheticData: "synthetic-or-consent", consent: "when-not-synthetic" },
  "vercel-connect": { minimumClassification: "restricted", accessScopes: ["security-release"], storageLocations: ["encrypted-evidence-store"], githubReleaseRoles: [], redactionProfile: "gate1-provider-v1", redactionStatus: "redacted", retentionPolicies: ["ci-30d"], ownerRoles: ["security-release"], syntheticData: "synthetic-or-consent", consent: "when-not-synthetic" },
  gmail: { minimumClassification: "restricted", accessScopes: ["security-release"], storageLocations: ["encrypted-evidence-store"], githubReleaseRoles: [], redactionProfile: "gate1-provider-v1", redactionStatus: "redacted", retentionPolicies: ["ci-30d"], ownerRoles: ["security-release"], syntheticData: "synthetic-or-consent", consent: "when-not-synthetic" },
  calendar: { minimumClassification: "restricted", accessScopes: ["security-release"], storageLocations: ["encrypted-evidence-store"], githubReleaseRoles: [], redactionProfile: "gate1-provider-v1", redactionStatus: "redacted", retentionPolicies: ["ci-30d"], ownerRoles: ["security-release"], syntheticData: "synthetic-or-consent", consent: "when-not-synthetic" },
  "human-observation": { minimumClassification: "restricted", accessScopes: ["security-release"], storageLocations: ["encrypted-evidence-store"], githubReleaseRoles: [], redactionProfile: "gate1-human-v1", redactionStatus: "redacted", retentionPolicies: ["human-90d"], ownerRoles: ["security-release"], syntheticData: "forbidden", consent: "required" },
  rollback: releaseArtifact,
  "sign-off": { minimumClassification: "restricted", accessScopes: ["security-release"], storageLocations: ["encrypted-evidence-store"], githubReleaseRoles: [], redactionProfile: "gate1-human-v1", redactionStatus: "redacted", retentionPolicies: ["release-365d", "release-lifetime"], ownerRoles: ["security-release"], syntheticData: "forbidden", consent: "required" },
} satisfies Record<Gate1EvidenceType, EvidenceGovernancePolicy>);

export type Gate1GovernanceEntry = {
  readonly type: Gate1EvidenceType;
  readonly result: "passed" | "failed" | "blocked";
  readonly recordedAt: string;
  readonly artifacts: readonly { readonly storage: Gate1StorageLocation; readonly role: "package" | "evidence" | "log" | "trace" | "signature" | "report" }[];
  readonly privacy: { readonly classification: Gate1Classification; readonly syntheticData: boolean; readonly redactionProfile: Gate1RedactionProfile; readonly redactionStatus: "redacted" | "not-required"; readonly accessScope: Gate1AccessScope; readonly retentionPolicy: Gate1RetentionPolicy; readonly retentionUntil?: string; readonly legalHold: boolean; readonly governanceOwnerRole: Gate1OwnerRole; readonly consentReference?: string; readonly retentionReference?: string; };
  readonly lifecycle: { readonly state: "active" | "quarantined" | "deleted"; readonly incidentReference?: string; readonly quarantinedAt?: string; readonly deletedAt?: string; readonly deletionReceiptReference?: string; };
};

export type Gate1GovernanceViolation = { readonly entryIndex: number; readonly path: readonly (string | number)[]; readonly message: string };
const classificationRank: Readonly<Record<Gate1Classification, number>> = Object.freeze({ public: 0, internal: 1, confidential: 2, restricted: 3 });
const expiringRetentionPolicies: ReadonlySet<Gate1RetentionPolicy> = new Set(["ci-30d", "internal-90d", "human-90d", "release-365d"]);

function timestampAfter(later: string, earlier: string): boolean { return Date.parse(later) > Date.parse(earlier); }

/** Validates every governance claim before a manifest is trusted. Unknown or contradictory claims fail closed. */
export function validateGate1EvidenceGovernance(entries: readonly Gate1GovernanceEntry[], now = new Date()): readonly Gate1GovernanceViolation[] {
  const violations: Gate1GovernanceViolation[] = [];
  const add = (entryIndex: number, path: readonly (string | number)[], message: string): void => { violations.push({ entryIndex, path, message }); };
  for (const [entryIndex, entry] of entries.entries()) {
    const policy: EvidenceGovernancePolicy = gate1EvidenceGovernancePolicy[entry.type];
    const privacy = entry.privacy;
    const lifecycle = entry.lifecycle;
    const isQuarantined = lifecycle.state === "quarantined";
    if (classificationRank[privacy.classification] < classificationRank[policy.minimumClassification]) add(entryIndex, ["privacy", "classification"], "Evidence classification is below the policy minimum.");
    if (!isQuarantined && !policy.accessScopes.includes(privacy.accessScope)) add(entryIndex, ["privacy", "accessScope"], "Evidence access scope is not authorized by policy.");
    if (!isQuarantined && !policy.ownerRoles.includes(privacy.governanceOwnerRole)) add(entryIndex, ["privacy", "governanceOwnerRole"], "Evidence governance owner role is not authorized by policy.");
    if (privacy.redactionProfile !== policy.redactionProfile || privacy.redactionStatus !== policy.redactionStatus) add(entryIndex, ["privacy"], "Evidence redaction profile or status does not meet policy.");
    if (!isQuarantined && !policy.retentionPolicies.includes(privacy.retentionPolicy)) add(entryIndex, ["privacy", "retentionPolicy"], "Evidence retention policy is not authorized by policy.");
    if (policy.syntheticData === "required" && !privacy.syntheticData) add(entryIndex, ["privacy", "syntheticData"], "Evidence policy requires synthetic data.");
    if (policy.syntheticData === "forbidden" && privacy.syntheticData) add(entryIndex, ["privacy", "syntheticData"], "Evidence policy forbids synthetic human evidence.");
    if ((policy.consent === "required" || (policy.consent === "when-not-synthetic" && !privacy.syntheticData)) && privacy.consentReference === undefined) add(entryIndex, ["privacy", "consentReference"], "Evidence policy requires a consent or attestation reference.");
    for (const [artifactIndex, artifact] of entry.artifacts.entries()) {
      if (!isQuarantined && !policy.storageLocations.includes(artifact.storage)) add(entryIndex, ["artifacts", artifactIndex, "storage"], "Artifact storage location is not authorized by policy.");
      const releaseRole = artifact.role === "package" || artifact.role === "signature" ? artifact.role : undefined;
      if (artifact.storage === "github-release" && (releaseRole === undefined || !policy.githubReleaseRoles.includes(releaseRole))) add(entryIndex, ["artifacts", artifactIndex, "storage"], "Only explicitly release-safe package or signature artifacts may use GitHub Releases.");
    }
    if (expiringRetentionPolicies.has(privacy.retentionPolicy)) {
      if (privacy.retentionUntil === undefined || !timestampAfter(privacy.retentionUntil, entry.recordedAt)) add(entryIndex, ["privacy", "retentionUntil"], "Expiring retention requires an expiry after recordedAt.");
      if (privacy.legalHold && privacy.retentionReference === undefined) add(entryIndex, ["privacy", "retentionReference"], "An expiry policy legal hold requires an explicit extension reference.");
      if (entry.result === "passed" && lifecycle.state === "active" && privacy.retentionUntil !== undefined && Date.parse(privacy.retentionUntil) <= now.getTime()) add(entryIndex, ["privacy", "retentionUntil"], "Expired active evidence cannot close Gate 1 as passed evidence.");
    } else if (privacy.retentionPolicy === "release-lifetime") {
      if (privacy.retentionUntil !== undefined || privacy.legalHold) add(entryIndex, ["privacy"], "Release-lifetime evidence omits expiry and legal hold.");
      if (policy.minimumClassification === "restricted" || entry.type === "human-observation") add(entryIndex, ["privacy", "retentionPolicy"], "Release-lifetime cannot retain restricted raw traces or human observations.");
    } else {
      if (privacy.retentionUntil !== undefined) add(entryIndex, ["privacy", "retentionUntil"], "Incident retention omits ordinary expiry.");
      if (!privacy.legalHold && privacy.retentionReference === undefined) add(entryIndex, ["privacy"], "Incident retention requires a legal hold or incident/retention reference.");
    }
    if (lifecycle.state === "active") {
      if (entry.artifacts.length === 0) add(entryIndex, ["artifacts"], "Active evidence requires at least one accessible safe artifact reference.");
      if (lifecycle.incidentReference !== undefined || lifecycle.quarantinedAt !== undefined || lifecycle.deletedAt !== undefined || lifecycle.deletionReceiptReference !== undefined) add(entryIndex, ["lifecycle"], "Active evidence cannot contain quarantine or deletion fields.");
    } else if (lifecycle.state === "quarantined") {
      if (entry.result === "passed") add(entryIndex, ["result"], "Quarantined evidence cannot support a passed Gate result.");
      if (privacy.accessScope !== "incident-response" || privacy.governanceOwnerRole !== "incident-response" || privacy.retentionPolicy !== "incident-7y-or-legal-hold" || entry.artifacts.some((artifact) => artifact.storage !== "encrypted-evidence-store") || lifecycle.incidentReference === undefined || lifecycle.quarantinedAt === undefined || lifecycle.deletedAt !== undefined || lifecycle.deletionReceiptReference !== undefined) add(entryIndex, ["lifecycle"], "Quarantined evidence requires incident-response encrypted retention with an incident reference.");
    } else {
      if (entry.result === "passed") add(entryIndex, ["result"], "Deleted evidence cannot support a passed Gate result.");
      if (lifecycle.deletedAt === undefined || !lifecycle.deletedAt.endsWith("Z") || lifecycle.deletionReceiptReference === undefined || lifecycle.incidentReference !== undefined || lifecycle.quarantinedAt !== undefined) add(entryIndex, ["lifecycle"], "Deleted evidence requires only a UTC deletion time and safe deletion-receipt reference.");
      if (entry.artifacts.length === 0) add(entryIndex, ["artifacts"], "Deleted evidence remains as a digest-bound tombstone.");
    }
  }
  return violations;
}
