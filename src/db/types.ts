import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const timestampSchema = z.string().datetime({ offset: true });
export const jsonObjectSchema = z.record(z.string(), z.unknown());
export const jsonArraySchema = z.array(z.unknown());

export const workspaceMemberStatusSchema = z.enum(["active", "invited", "suspended", "removed"]);
export const documentKindSchema = z.enum(["page", "database", "ai_view", "form"]);
export const documentVisibilitySchema = z.enum(["workspace", "restricted", "private"]);
export const automationModeSchema = z.enum(["disabled", "simulation", "dry_run", "approval_required", "active"]);
export const automationRunStatusSchema = z.enum(["queued", "running", "waiting", "approval_required", "paused", "failed", "cancelled", "completed"]);
export const auditActorTypeSchema = z.enum(["user", "agent", "automation", "system"]);

export const userSchema = z.object({ id: uuidSchema, email: z.string().email(), displayName: z.string().min(1), avatarUrl: z.string().url().nullable(), createdAt: timestampSchema, updatedAt: timestampSchema, deletedAt: timestampSchema.nullable() });
export const workspaceSchema = z.object({ id: uuidSchema, ownerUserId: uuidSchema, name: z.string().min(1), slug: z.string().min(1), settings: jsonObjectSchema, createdAt: timestampSchema, updatedAt: timestampSchema, deletedAt: timestampSchema.nullable() });
export const permissionSchema = z.object({ id: uuidSchema, permissionKey: z.string().min(1), description: z.string().min(1), createdAt: timestampSchema });
export const roleSchema = z.object({ id: uuidSchema, workspaceId: uuidSchema, name: z.string().min(1), description: z.string().nullable(), isSystemRole: z.boolean(), createdAt: timestampSchema, updatedAt: timestampSchema });
export const rolePermissionSchema = z.object({ roleId: uuidSchema, permissionId: uuidSchema, grantedAt: timestampSchema });
export const workspaceMemberSchema = z.object({ workspaceId: uuidSchema, userId: uuidSchema, roleId: uuidSchema, status: workspaceMemberStatusSchema, invitedByUserId: uuidSchema.nullable(), joinedAt: timestampSchema.nullable(), createdAt: timestampSchema, updatedAt: timestampSchema });
export const documentSchema = z.object({ id: uuidSchema, workspaceId: uuidSchema, parentDocumentId: uuidSchema.nullable(), createdByUserId: uuidSchema, kind: documentKindSchema, visibility: documentVisibilitySchema, title: z.string(), content: jsonObjectSchema, metadata: jsonObjectSchema, currentVersion: z.number().int().positive(), createdAt: timestampSchema, updatedAt: timestampSchema, deletedAt: timestampSchema.nullable() });
export const documentVersionSchema = z.object({ id: uuidSchema, documentId: uuidSchema, versionNumber: z.number().int().positive(), content: jsonObjectSchema, changeSummary: z.string().nullable(), actorUserId: uuidSchema.nullable(), agentRunId: uuidSchema.nullable(), createdAt: timestampSchema });
export const structuredRecordSchema = z.object({ id: uuidSchema, workspaceId: uuidSchema, collectionDocumentId: uuidSchema, createdByUserId: uuidSchema, values: jsonObjectSchema, metadata: jsonObjectSchema, createdAt: timestampSchema, updatedAt: timestampSchema, deletedAt: timestampSchema.nullable() });
export const automationSchema = z.object({ id: uuidSchema, workspaceId: uuidSchema, ownerUserId: uuidSchema, name: z.string().min(1), description: z.string().nullable(), mode: automationModeSchema, triggerDefinition: jsonObjectSchema, conditions: jsonArraySchema, actions: jsonArraySchema, exceptions: jsonArraySchema, approvalPolicy: jsonObjectSchema, limits: jsonObjectSchema, failurePolicy: jsonObjectSchema, notificationPolicy: jsonObjectSchema, createdAt: timestampSchema, updatedAt: timestampSchema, deletedAt: timestampSchema.nullable() });
export const runMetadataSchema = z.object({ id: uuidSchema, workspaceId: uuidSchema, automationId: uuidSchema.nullable(), initiatedByUserId: uuidSchema.nullable(), externalRunId: z.string().nullable(), idempotencyKey: z.string().min(1), status: automationRunStatusSchema, trigger: jsonObjectSchema, inputReferences: jsonArraySchema, outputReferences: jsonArraySchema, toolCalls: jsonArraySchema, permissionSnapshot: jsonObjectSchema, approvalState: jsonObjectSchema, modelUsage: jsonObjectSchema, errorDetails: jsonObjectSchema.nullable(), retryCount: z.number().int().nonnegative(), startedAt: timestampSchema.nullable(), completedAt: timestampSchema.nullable(), expiresAt: timestampSchema.nullable(), createdAt: timestampSchema, updatedAt: timestampSchema });
export const auditIndexSchema = z.object({ id: uuidSchema, workspaceId: uuidSchema, runId: uuidSchema.nullable(), actorType: auditActorTypeSchema, actorUserId: uuidSchema.nullable(), action: z.string().min(1), resourceType: z.string().min(1), resourceId: uuidSchema.nullable(), sourceReferences: jsonArraySchema, outputReferences: jsonArraySchema, permissionSnapshot: jsonObjectSchema, metadata: jsonObjectSchema, occurredAt: timestampSchema });

export type User = z.infer<typeof userSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type Role = z.infer<typeof roleSchema>;
export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>;
export type Document = z.infer<typeof documentSchema>;
export type DocumentVersion = z.infer<typeof documentVersionSchema>;
export type StructuredRecord = z.infer<typeof structuredRecordSchema>;
export type Automation = z.infer<typeof automationSchema>;
export type RunMetadata = z.infer<typeof runMetadataSchema>;
export type AuditIndex = z.infer<typeof auditIndexSchema>;
