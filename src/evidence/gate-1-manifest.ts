import { z } from "zod";

const commitSchema = z.string().regex(/^[a-f0-9]{40}$/, "Expected a lowercase 40-character Git commit SHA.");
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, "Expected a lowercase SHA-256 digest.");
const timestampSchema = z.string().datetime({ offset: true });

function isSafeSourceReference(value: string): boolean {
  if (value !== value.trim() || value.length === 0 || /\s/.test(value)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.username === "" && url.password === "" && url.search === "" && url.hash === "" && url.hostname.length > 0;
    } catch {
      return false;
    }
  }
  return !value.startsWith("/") && !value.startsWith("\\") && !/^[a-z]:/i.test(value) && !value.includes("\\") && !value.split("/").some((segment) => segment === "" || segment === "." || segment === "..");
}

export const gate1SourceReferenceSchema = z.string().refine(isSafeSourceReference, {
  message: "Expected a repository-relative path or a credential-free HTTPS URL.",
});

const artifactRoleSchema = z.enum(["package", "evidence", "log", "trace", "signature", "report"]);
const artifactSchema = z.object({
  reference: gate1SourceReferenceSchema,
  sha256: sha256Schema,
  role: artifactRoleSchema,
  mediaType: z.string().min(1),
  purpose: z.string().min(1),
}).strict();

const privacySchema = z.object({
  classification: z.enum(["public", "internal", "confidential", "restricted"]),
  syntheticData: z.boolean(),
  redactionStatus: z.enum(["redacted", "not-required"]),
  accessScope: z.string().min(1),
  consentReference: gate1SourceReferenceSchema.optional(),
  retentionReference: gate1SourceReferenceSchema.optional(),
}).strict();

const signedArtifactSchema = z.object({
  sha256: sha256Schema,
  signatureReference: gate1SourceReferenceSchema,
}).strict();

const subjectSchema = z.object({
  kind: z.enum(["development", "frozen-release-candidate"]),
  commit: commitSchema,
  signedArtifacts: z.array(signedArtifactSchema),
}).strict().superRefine((subject, context) => {
  if (subject.kind === "development" && subject.signedArtifacts.length > 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["signedArtifacts"], message: "Development subjects cannot claim frozen-candidate signatures." });
  }
  if (subject.kind === "frozen-release-candidate" && subject.signedArtifacts.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["signedArtifacts"], message: "Frozen release candidates require signed artifact digests." });
  }
});

export const gate1EvidenceTypeSchema = z.enum([
  "native-library", "desktop-directory-package", "installer", "credential-round-trip", "signing-notarization", "cold-start", "durable-resume", "language-quality", "product-journey", "eve", "ai-sdk-7", "vercel-connect", "gmail", "calendar", "human-observation", "rollback", "sign-off",
]);

const humanAttestationSchema = z.object({
  actorReference: z.string().regex(/^[a-z0-9][a-z0-9._:-]{2,127}$/i, "Expected an opaque actor reference."),
  role: z.string().regex(/^[a-z][a-z0-9-]{1,63}$/, "Expected a machine-readable human role."),
  decision: z.enum(["observed", "approved", "rejected"]),
  timestamp: timestampSchema,
  context: z.object({
    scope: z.string().min(1),
    summary: z.string().min(1),
  }).strict(),
}).strict();

const evidenceBase = {
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  type: gate1EvidenceTypeSchema,
  provenance: z.enum(["deterministic-local", "ci", "live-provider", "human"]),
  recordedAt: timestampSchema,
  environment: z.object({ operatingSystem: z.string().min(1), architecture: z.string().min(1), runner: z.string().min(1) }).strict(),
  subjectCommit: commitSchema,
  sources: z.array(gate1SourceReferenceSchema).min(1),
  packageSha256: sha256Schema.optional(),
  limitations: z.array(z.string().min(1)),
  privacy: privacySchema,
  humanAttestation: humanAttestationSchema.optional(),
};

const passedEvidenceEntrySchema = z.object({ ...evidenceBase, result: z.literal("passed"), artifacts: z.array(artifactSchema).min(1) }).strict();
const failedEvidenceEntrySchema = z.object({ ...evidenceBase, result: z.literal("failed"), artifacts: z.array(artifactSchema).min(1), failure: z.string().min(1) }).strict();
const blockedEvidenceEntrySchema = z.object({ ...evidenceBase, result: z.literal("blocked"), artifacts: z.array(artifactSchema), limitations: z.array(z.string().min(1)).min(1) }).strict();
const evidenceEntrySchema = z.discriminatedUnion("result", [passedEvidenceEntrySchema, failedEvidenceEntrySchema, blockedEvidenceEntrySchema]);

const providerEvidenceTypes: ReadonlySet<string> = new Set(["credential-round-trip", "eve", "ai-sdk-7", "vercel-connect", "gmail", "calendar"]);
const humanEvidenceTypes: ReadonlySet<string> = new Set(["human-observation", "sign-off"]);
const packageEvidenceTypes: ReadonlySet<string> = new Set(["desktop-directory-package", "installer"]);

export const gate1EvidenceManifestSchema = z.object({
  schemaVersion: z.literal(1),
  gate: z.literal("gate-1"),
  generatedAt: timestampSchema,
  subject: subjectSchema,
  evidence: z.array(evidenceEntrySchema).min(1),
}).strict().superRefine((manifest, context) => {
  const ids = new Set<string>();
  const artifactReferences = new Set<string>();
  const artifactDigests = new Set<string>();
  const packageDigests = new Set<string>();
  const signedDigests = new Set<string>();

  for (const [index, signedArtifact] of manifest.subject.signedArtifacts.entries()) {
    if (signedDigests.has(signedArtifact.sha256)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["subject", "signedArtifacts", index, "sha256"], message: "Signed artifact digests must be unique." });
    signedDigests.add(signedArtifact.sha256);
  }

  for (const [entryIndex, entry] of manifest.evidence.entries()) {
    if (ids.has(entry.id)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "id"], message: "Evidence IDs must be unique." });
    ids.add(entry.id);
    if (entry.subjectCommit !== manifest.subject.commit) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "subjectCommit"], message: "Evidence must use the manifest subject commit." });

    const isProvider = providerEvidenceTypes.has(entry.type);
    const isHuman = humanEvidenceTypes.has(entry.type);
    if (isProvider && entry.provenance !== "live-provider") context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "provenance"], message: "Provider evidence requires live-provider provenance." });
    if (isHuman && entry.provenance !== "human") context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "provenance"], message: "Human evidence requires human provenance." });
    if (!isProvider && !isHuman && (entry.provenance === "live-provider" || entry.provenance === "human")) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "provenance"], message: "Only provider and human evidence may claim elevated provenance." });
    if (isProvider && (entry.privacy.redactionStatus !== "redacted" || (!entry.privacy.syntheticData && entry.privacy.consentReference === undefined))) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "privacy"], message: "Provider evidence must be redacted and use synthetic data or document consent." });
    if (isHuman) {
      if (entry.privacy.syntheticData || entry.privacy.redactionStatus !== "redacted" || entry.privacy.consentReference === undefined) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "privacy"], message: "Human evidence must be non-synthetic, redacted, and document consent." });
      if (entry.humanAttestation === undefined) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "humanAttestation"], message: "Human evidence requires an attestation." });
      if (entry.type === "human-observation" && entry.humanAttestation?.decision !== "observed") context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "humanAttestation", "decision"], message: "Human observations require an observed decision." });
      if (entry.type === "sign-off" && entry.humanAttestation !== undefined && entry.humanAttestation.decision === "observed") context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "humanAttestation", "decision"], message: "Sign-offs require an approved or rejected decision." });
    }

    const packageArtifacts = entry.artifacts.filter((artifact) => artifact.role === "package");
    if (packageEvidenceTypes.has(entry.type) && (packageArtifacts.length !== 1 || entry.packageSha256 !== packageArtifacts[0]?.sha256)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "packageSha256"], message: "Package entries require exactly one package artifact and a matching package digest binding." });
    if (!packageEvidenceTypes.has(entry.type) && packageArtifacts.length > 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "artifacts"], message: "Only package entries may declare package artifacts." });

    for (const [artifactIndex, artifact] of entry.artifacts.entries()) {
      if (artifactReferences.has(artifact.reference)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "artifacts", artifactIndex, "reference"], message: "Artifact references must be unique across the manifest." });
      if (artifactDigests.has(artifact.sha256)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "artifacts", artifactIndex, "sha256"], message: "Artifact payload digests must be unique across the manifest." });
      artifactReferences.add(artifact.reference);
      artifactDigests.add(artifact.sha256);
      if (artifact.role === "package") packageDigests.add(artifact.sha256);
      if (manifest.subject.kind === "frozen-release-candidate" && !signedDigests.has(artifact.sha256)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "artifacts", artifactIndex, "sha256"], message: "Frozen-candidate artifacts require a matching signed digest." });
    }
  }

  for (const [entryIndex, entry] of manifest.evidence.entries()) {
    if (entry.packageSha256 !== undefined && !packageDigests.has(entry.packageSha256)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "packageSha256"], message: "Package digest must identify an actual package artifact in the manifest." });
    if (manifest.subject.kind === "frozen-release-candidate" && entry.packageSha256 !== undefined && !signedDigests.has(entry.packageSha256)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "packageSha256"], message: "Frozen-candidate package digests require a matching signed digest." });
  }
});

export type Gate1EvidenceManifestInput = z.input<typeof gate1EvidenceManifestSchema>;
type DeepReadonly<T> = T extends (...arguments_: never[]) => unknown ? T : T extends readonly (infer Item)[] ? readonly DeepReadonly<Item>[] : T extends object ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> } : T;
export type Gate1EvidenceManifest = DeepReadonly<z.output<typeof gate1EvidenceManifestSchema>>;
export type Gate1EvidenceEntry = Gate1EvidenceManifest["evidence"][number];
export type Gate1EvidenceType = z.infer<typeof gate1EvidenceTypeSchema>;

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nestedValue of Object.values(value)) deepFreeze(nestedValue);
  }
  return value as DeepReadonly<T>;
}

/** Parses version 1 Gate 1 evidence and intentionally exposes no partial, mutable result. */
export function parseGate1EvidenceManifest(value: unknown): Gate1EvidenceManifest {
  const parsed = gate1EvidenceManifestSchema.safeParse(value);
  if (!parsed.success) throw new Error("Invalid Gate 1 evidence manifest.");
  return deepFreeze(parsed.data);
}
