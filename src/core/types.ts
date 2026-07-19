/**
 * Creature OS — Shared domain types & FR->module contract.
 * Every subsystem imports from here so the architecture boundary (PRD §12) stays coherent.
 */

// ---------------------------------------------------------------------------
// Functional requirement identity (traceability-graph.md)
// ---------------------------------------------------------------------------
export type FRId =
  | `GO-${string}` | `WRITE-${string}` | `MAIL-${string}`
  | `DOCS-${string}` | `MEM-${string}` | `AUTO-${string}` | `TEAM-${string}`;

export interface FRContract {
  id: FRId;
  title: string;
  sourceSection: string; // PRD § reference
  phase: 0 | 1 | 2 | 3 | 4 | 5;
  implementedBy: string; // module path
}

// ---------------------------------------------------------------------------
// Permission classes (PRD §13.1)
// ---------------------------------------------------------------------------
export type PermissionClass =
  | 'read-only'
  | 'local-reversible-write'
  | 'external-reversible-write'
  | 'external-consequential-write'
  | 'destructive';

// ---------------------------------------------------------------------------
// Approval / VFS action-shadowing (PRD §7.3, §13, existing VFS foundation)
// ---------------------------------------------------------------------------
export type ProposalImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'DESTRUCTIVE';

export interface ToolProposal {
  id: string;
  action: string; // namespaced tool id, e.g. "mail:send"
  args: Record<string, unknown>;
  previewData: { summary: string; impact: ProposalImpact; permissionClass?: PermissionClass };
  fr?: FRId;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected' | 'committed' | 'expired';
}

export interface ApprovalRecord {
  proposalId: string;
  actor: string;
  decision: 'approved' | 'rejected';
  at: number;
}

// ---------------------------------------------------------------------------
// Audit (PRD §13.3)
// ---------------------------------------------------------------------------
export interface AuditEvent {
  id: string;
  actor: string;
  agent?: string;
  agentVersion?: string;
  trigger: string;
  inputs?: unknown;
  sourceRefs?: string[];
  toolsCalled?: string[];
  permissionsUsed?: PermissionClass[];
  approvals?: ApprovalRecord[];
  externalChanges?: string[];
  outputRefs?: string[];
  cost?: number;
  durationMs?: number;
  error?: string;
  retryState?: string;
  at: number;
}

// ---------------------------------------------------------------------------
// Connectors (PRD §12.4, AUTO-004/005)
// ---------------------------------------------------------------------------
export interface ConnectorScope {
  read: boolean;
  write: boolean;
  grantedScopes: string[];
}
export interface ConnectorHealth {
  id: string;
  status: 'connected' | 'error' | 'expired' | 'reconnecting';
  lastSuccessfulSync?: number;
  scopes: ConnectorScope;
  tokenExpiry?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Memory (Mnemosyne, MEM-001..005, §12.5)
// ---------------------------------------------------------------------------
export type MemoryCategory =
  | 'personal-preference' | 'writing-voice' | 'communication-preference'
  | 'project-context' | 'workspace-terminology' | 'reusable-procedure'
  | 'relationship-context';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  value: string;
  scope: 'user' | 'workspace' | 'project' | 'task';
  scopeId?: string;
  provenance: 'inferred' | 'user-confirmed';
  confidence: number; // 0..1
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  sensitive: boolean;
}

// ---------------------------------------------------------------------------
// Plans & model policy (GO-005, §12.3)
// ---------------------------------------------------------------------------
export interface ExecutionPreview {
  intendedActions: string[];
  expectedSystems: string[];
  estimatedCostRange?: [number, number];
  requiredApprovals: string[];
}

export type ModelTier = 'cheap' | 'standard' | 'strong';
export interface ModelPolicy {
  routine: ModelTier; // classify/rewrite/extract/summarize
  complex: ModelTier; // planning/research/high-impact drafts
}

// ---------------------------------------------------------------------------
// Automation (AUTO-001..005)
// ---------------------------------------------------------------------------
export type AutomationMode = 'disabled' | 'simulation' | 'dry-run' | 'approval-required' | 'active';
export interface AutomationSafetyLimits {
  maxActionsPerRun?: number;
  maxDailyActions?: number;
  maxModelSpend?: number;
  permittedHours?: [number, number];
  allowedRecipients?: string[];
  allowedDomains?: string[];
  prohibitedLabels?: string[];
  requiredApprovers?: string[];
}

export interface Automation {
  id: string;
  name: string;
  owner: string;
  trigger: string;
  conditions: string;
  actions: string;
  exceptions: string;
  approvalPolicy: string;
  spendLimit?: number;
  runLimit?: number;
  failureBehavior: string;
  notificationPolicy: string;
  mode: AutomationMode;
  safety: AutomationSafetyLimits;
  audit: AuditEvent[];
}

// ---------------------------------------------------------------------------
// Team / Enterprise (TEAM-001..005)
// ---------------------------------------------------------------------------
export type Role = 'owner' | 'administrator' | 'member' | 'guest' | 'custom';
export interface WorkspaceMember {
  id: string;
  email: string;
  role: Role;
  customRoleId?: string;
}
export interface EnterpriseControls {
  sso?: { type: 'SAML' | 'OIDC'; enabled: boolean };
  scim?: { enabled: boolean };
  domainCapture?: boolean;
  rbac?: boolean;
  auditExport?: boolean;
  retentionPolicyDays?: number;
  legalHold?: boolean;
  modelAllowlist?: string[];
  connectorAllowlist?: string[];
  agentAllowlist?: string[];
  mcpAllowlist?: string[];
  regionalControls?: string[];
  customerManagedEncryption?: boolean;
}

// ---------------------------------------------------------------------------
// Result helper
// ---------------------------------------------------------------------------
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T>(error: string): Result<T> => ({ ok: false, error });
