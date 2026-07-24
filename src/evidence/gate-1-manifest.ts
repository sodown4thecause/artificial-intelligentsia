import { z } from "zod";

const commitSchema = z.string().regex(/^[a-f0-9]{40}$/, "Expected a lowercase 40-character Git commit SHA.");
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, "Expected a lowercase SHA-256 digest.");
const timestampSchema = z.string().datetime({ offset: true });

function isSafeSourceReference(value: string): boolean {
  if (value !== value.trim() || value.length === 0 || /\s/.test(value)) return false;

  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    try {
      const url = new URL(value);
      return url.protocol === "https:"
        && url.username === ""
        && url.password === ""
        && url.search === ""
        && url.hash === ""
        && url.hostname.length > 0;
    } catch {
      return false;
    }
  }

  return !value.startsWith("/")
    && !value.startsWith("\\")
    && !/^[a-z]:/i.test(value)
    && !value.includes("\\")
    && !value.split("/").some((segment) => segment === "" || segment === "." || segment === "..");
}

export const gate1SourceReferenceSchema = z.string().refine(isSafeSourceReference, {
  message: "Expected a repository-relative path or a credential-free HTTPS URL.",
});

const artifactSchema = z.object({
  reference: gate1SourceReferenceSchema,
  sha256: sha256Schema,
  mediaType: z.string().min(1),
  purpose: z.string().min(1),
  packageSha256: sha256Schema.optional(),
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
  "native-library",
  "desktop-directory-package",
  "installer",
  "credential-round-trip",
  "signing-notarization",
  "cold-start",
  "durable-resume",
  "language-quality",
  "product-journey",
  "eve",
  "ai-sdk-7",
  "vercel-connect",
  "gmail",
  "calendar",
  "human-observation",
  "rollback",
  "sign-off",
]);

const evidenceEntrySchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  type: gate1EvidenceTypeSchema,
  provenance: z.enum(["deterministic-local", "ci", "live-provider", "human"]),
  result: z.enum(["passed", "failed", "blocked"]),
  recordedAt: timestampSchema,
  environment: z.object({
    operatingSystem: z.string().min(1),
    architecture: z.string().min(1),
    runner: z.string().min(1),
  }).strict(),
  subjectCommit: commitSchema,
  sources: z.array(gate1SourceReferenceSchema).min(1),
  artifacts: z.array(artifactSchema).min(1),
  limitations: z.array(z.string().min(1)),
  failure: z.string().min(1).optional(),
  privacy: privacySchema,
}).strict().superRefine((entry, context) => {
  if (entry.result === "passed" && entry.failure !== undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["failure"], message: "Passed evidence cannot have a failure." });
  }
  if (entry.result === "failed" && entry.failure === undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["failure"], message: "Failed evidence requires a failure." });
  }
  if (entry.result === "blocked" && entry.limitations.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["limitations"], message: "Blocked evidence requires a limitation." });
  }
});

const providerEvidenceTypes: ReadonlySet<string> = new Set(["credential-round-trip", "eve", "ai-sdk-7", "vercel-connect", "gmail", "calendar"]);
const packageEvidenceTypes: ReadonlySet<string> = new Set(["desktop-directory-package", "installer", "signing-notarization"]);

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
  const signedDigests = new Set<string>();

  for (const signedArtifact of manifest.subject.signedArtifacts) {
    if (signedDigests.has(signedArtifact.sha256)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["subject", "signedArtifacts"], message: "Signed artifact digests must be unique." });
    }
    signedDigests.add(signedArtifact.sha256);
  }

  for (const [entryIndex, entry] of manifest.evidence.entries()) {
    if (ids.has(entry.id)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "id"], message: "Evidence IDs must be unique." });
    }
    ids.add(entry.id);

    if (entry.subjectCommit !== manifest.subject.commit) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "subjectCommit"], message: "Evidence must use the manifest subject commit." });
    }
    if (providerEvidenceTypes.has(entry.type) && entry.provenance !== "live-provider") {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "provenance"], message: "Provider evidence requires live-provider provenance." });
    }
    if ((entry.type === "human-observation" || entry.type === "sign-off") && entry.provenance !== "human") {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "provenance"], message: "Human observation and sign-off require human provenance." });
    }
    if ((entry.provenance === "live-provider" || entry.provenance === "human")
      && (entry.privacy.redactionStatus !== "redacted" || (!entry.privacy.syntheticData && entry.privacy.consentReference === undefined))) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "privacy"], message: "Provider and human evidence must be redacted and use synthetic data or document consent." });
    }

    let hasPackageBinding = false;
    const entryArtifactDigests = new Set(entry.artifacts.map((artifact) => artifact.sha256));
    for (const [artifactIndex, artifact] of entry.artifacts.entries()) {
      if (artifactReferences.has(artifact.reference)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "artifacts", artifactIndex, "reference"], message: "Artifact references must be unique across the manifest." });
      }
      if (artifactDigests.has(artifact.sha256)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "artifacts", artifactIndex, "sha256"], message: "Artifact digests must be unique across the manifest." });
      }
      artifactReferences.add(artifact.reference);
      artifactDigests.add(artifact.sha256);

      if (artifact.packageSha256 !== undefined) {
        hasPackageBinding = true;
        if (!entryArtifactDigests.has(artifact.packageSha256)) {
          context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "artifacts", artifactIndex, "packageSha256"], message: "Package digest must bind to an artifact in the same evidence entry." });
        }
      }
      if (manifest.subject.kind === "frozen-release-candidate" && !signedDigests.has(artifact.sha256)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "artifacts", artifactIndex, "sha256"], message: "Frozen-candidate artifacts require a matching signed digest." });
      }
    }
    if (packageEvidenceTypes.has(entry.type) && !hasPackageBinding) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidence", entryIndex, "artifacts"], message: "Package evidence requires an explicit package digest binding." });
    }
  }
});

export type Gate1EvidenceManifest = z.infer<typeof gate1EvidenceManifestSchema>;
export type Gate1EvidenceEntry = z.infer<typeof evidenceEntrySchema>;
export type Gate1EvidenceType = z.infer<typeof gate1EvidenceTypeSchema>;

/** Parses version 1 Gate 1 evidence and intentionally exposes no partial result. */
export function parseGate1EvidenceManifest(value: unknown): Gate1EvidenceManifest {
  const parsed = gate1EvidenceManifestSchema.safeParse(value);
  if (!parsed.success) throw new Error("Invalid Gate 1 evidence manifest.");
  return parsed.data;
}
