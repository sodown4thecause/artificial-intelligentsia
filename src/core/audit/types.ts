import { randomBytes } from 'node:crypto';
import { z } from 'zod';

const identifier = z.string().min(1);

export const AuditReferenceSchema = z
  .object({
    id: identifier,
    system: z.string().min(1),
    kind: z.string().min(1),
  })
  .strict();

export type AuditReference = z.infer<typeof AuditReferenceSchema>;

export const SensitiveContentReferenceSchema = AuditReferenceSchema.extend({
  id: z.string().regex(/^sensitive_[A-Za-z0-9_-]{32,}$/),
  kind: z.literal('sensitive-content'),
}).strict();

export type SensitiveContentReference = z.infer<typeof SensitiveContentReferenceSchema>;

/**
 * Creates an opaque reference for content that must not be persisted in audit
 * records. The caller stores the actual content in its appropriate secret store.
 */
export function createSensitiveContentReference(system: string): SensitiveContentReference {
  return SensitiveContentReferenceSchema.parse({
    id: `sensitive_${randomBytes(24).toString('base64url')}`,
    system,
    kind: 'sensitive-content',
  });
}

export const AuditActorSchema = z
  .object({
    id: identifier,
    type: z.enum(['user', 'agent', 'system', 'service']),
  })
  .strict();

export const AuditAgentSchema = z
  .object({
    id: identifier,
    version: z.string().min(1),
  })
  .strict();

export const AuditTriggerSchema = z
  .object({
    type: z.enum(['user', 'schedule', 'webhook', 'automation', 'retry', 'system']),
    reference: AuditReferenceSchema.nullable(),
  })
  .strict();

export const AuditToolCallSchema = z
  .object({
    name: z.string().min(1),
    inputReferences: z.array(AuditReferenceSchema),
    outputReferences: z.array(AuditReferenceSchema),
    status: z.enum(['succeeded', 'failed', 'denied']),
  })
  .strict();

export const AuditApprovalSchema = z
  .object({
    id: identifier,
    status: z.enum(['not-required', 'pending', 'approved', 'rejected', 'expired']),
    approver: AuditActorSchema.nullable(),
  })
  .strict();

export const AuditExternalChangeSchema = z
  .object({
    action: z.string().min(1),
    target: AuditReferenceSchema,
    result: z.enum(['applied', 'failed', 'reverted']),
  })
  .strict();

export const AuditCostSchema = z
  .object({
    amount: z.number().finite().nonnegative(),
    currency: z.string().length(3).toUpperCase(),
  })
  .strict();

export const AuditErrorSchema = z
  .object({
    code: z.string().min(1),
    message: z.string().min(1),
  })
  .strict();

export const AuditRetrySchema = z
  .object({
    attempt: z.number().int().nonnegative(),
    maxAttempts: z.number().int().positive(),
    nextRetryAt: z.string().datetime().nullable(),
  })
  .strict()
  .refine((retry) => retry.attempt <= retry.maxAttempts, {
    message: 'retry attempt cannot exceed maxAttempts',
  });

export const AuditEventInputSchema = z
  .object({
    workspaceId: identifier,
    runId: identifier,
    actor: AuditActorSchema,
    agent: AuditAgentSchema,
    trigger: AuditTriggerSchema,
    inputReferences: z.array(AuditReferenceSchema),
    sourceReferences: z.array(AuditReferenceSchema),
    toolsCalled: z.array(AuditToolCallSchema),
    permissionsUsed: z.array(z.string().min(1)),
    approvals: z.array(AuditApprovalSchema),
    externalChanges: z.array(AuditExternalChangeSchema),
    outputReferences: z.array(AuditReferenceSchema),
    cost: AuditCostSchema,
    durationMs: z.number().finite().nonnegative(),
    state: z.enum(['succeeded', 'failed', 'retrying']),
    error: AuditErrorSchema.nullable(),
    retry: AuditRetrySchema,
    occurredAt: z.string().datetime().optional(),
  })
  .strict();

export type AuditEventInput = z.infer<typeof AuditEventInputSchema>;

export const AuditEventSchema = AuditEventInputSchema.extend({
  id: z.string().regex(/^audit_evt_[A-Za-z0-9_-]{32,}$/),
  occurredAt: z.string().datetime(),
  previousHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

export type AuditEvent = z.infer<typeof AuditEventSchema>;

export interface AuditTimeRange {
  from?: Date | string;
  to?: Date | string;
}
