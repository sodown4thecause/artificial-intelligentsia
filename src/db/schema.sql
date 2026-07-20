-- Creature OS product data. Apply with PostgreSQL 14+.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE workspace_member_status AS ENUM ('active', 'invited', 'suspended', 'removed');
CREATE TYPE document_kind AS ENUM ('page', 'database', 'ai_view', 'form');
CREATE TYPE document_visibility AS ENUM ('workspace', 'restricted', 'private');
CREATE TYPE automation_mode AS ENUM ('disabled', 'simulation', 'dry_run', 'approval_required', 'active');
CREATE TYPE automation_run_status AS ENUM ('queued', 'running', 'waiting', 'approval_required', 'paused', 'failed', 'cancelled', 'completed');
CREATE TYPE audit_actor_type AS ENUM ('user', 'agent', 'automation', 'system');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name),
  UNIQUE (id, workspace_id)
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL,
  status workspace_member_status NOT NULL DEFAULT 'invited',
  invited_by_user_id UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (role_id, workspace_id) REFERENCES roles(id, workspace_id)
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  kind document_kind NOT NULL DEFAULT 'page',
  visibility document_visibility NOT NULL DEFAULT 'workspace',
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_version INTEGER NOT NULL DEFAULT 1 CHECK (current_version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  content JSONB NOT NULL,
  change_summary TEXT,
  actor_user_id UUID REFERENCES users(id),
  agent_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_number)
);

CREATE TABLE structured_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  collection_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  values JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  mode automation_mode NOT NULL DEFAULT 'disabled',
  trigger_definition JSONB NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  exceptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  failure_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  notification_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE run_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES automations(id) ON DELETE SET NULL,
  initiated_by_user_id UUID REFERENCES users(id),
  external_run_id TEXT UNIQUE,
  idempotency_key TEXT NOT NULL,
  status automation_run_status NOT NULL DEFAULT 'queued',
  trigger JSONB NOT NULL DEFAULT '{}'::jsonb,
  input_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  output_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  tool_calls JSONB NOT NULL DEFAULT '[]'::jsonb,
  permission_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_details JSONB,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, idempotency_key)
);

ALTER TABLE document_versions
  ADD CONSTRAINT document_versions_agent_run_id_fkey
  FOREIGN KEY (agent_run_id) REFERENCES run_metadata(id) ON DELETE SET NULL;

CREATE TABLE audit_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  run_id UUID REFERENCES run_metadata(id) ON DELETE SET NULL,
  actor_type audit_actor_type NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  source_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  output_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  permission_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX documents_workspace_updated_idx ON documents (workspace_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX structured_records_collection_idx ON structured_records (workspace_id, collection_document_id) WHERE deleted_at IS NULL;
CREATE INDEX automations_workspace_mode_idx ON automations (workspace_id, mode) WHERE deleted_at IS NULL;
CREATE INDEX run_metadata_workspace_status_idx ON run_metadata (workspace_id, status, created_at DESC);
CREATE INDEX audit_index_workspace_occurred_idx ON audit_index (workspace_id, occurred_at DESC);
