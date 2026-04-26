-- Migration: admin_audit_log
--
-- Records every mutating admin action. Required for any government/MoF
-- procurement compliance conversation: "show us the audit trail of who
-- changed which user's access and when."
--
-- Writes are service_role only (admin server actions are the only legitimate
-- writers). Reads scoped to admins via RLS.
--
-- Apply order: any time after migration-user-administration.sql.
-- Idempotent.

create table if not exists public.admin_audit_log (
  id           uuid        primary key default uuid_generate_v4(),
  created_at   timestamptz not null default now(),

  -- Who acted. actor_email denormalised for fast read (admin viewer page)
  -- so we don't have to join to auth.users on every render.
  actor_id     uuid        not null references public.profiles(id),
  actor_email  text        not null,

  -- What happened. action is a stable string key (e.g. 'approve_user').
  action       text        not null,

  -- What was acted on. target_id is nullable for actions like 'bulk_approve'
  -- where the targets are an array (stored in metadata).
  target_type  text        not null,
  target_id    uuid,

  -- Before/after snapshots of the changed fields (small jsonb objects, NOT
  -- the full row). Free-form metadata for everything else (reasons, ids
  -- arrays, etc.).
  before       jsonb,
  after        jsonb,
  metadata     jsonb
);

create index if not exists admin_audit_log_actor_idx
  on public.admin_audit_log(actor_id, created_at desc);

create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log(target_type, target_id, created_at desc);

create index if not exists admin_audit_log_action_idx
  on public.admin_audit_log(action, created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "Audit log read for admins" on public.admin_audit_log;
create policy "Audit log read for admins"
  on public.admin_audit_log for select
  using (is_admin());

-- No insert/update/delete policy — service_role bypasses RLS, and we want
-- the audit log to be append-only from the application side.

comment on table public.admin_audit_log is
  'Append-only log of admin server-action mutations. Populated by lib/admin/audit.ts.';
