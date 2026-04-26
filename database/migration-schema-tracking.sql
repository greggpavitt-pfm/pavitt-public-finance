-- Migration: schema_migrations tracking table
--
-- Records which migration files have been applied. Replaces the ad-hoc
-- "run information_schema queries to check before pasting SQL" workflow
-- documented in the admin guide.
--
-- Use the CLI helpers (npm run migrate:status / migrate:apply) — see
-- scripts/migrate.ts. The CLI does NOT execute the SQL itself; it just
-- records the row after a successful manual apply via the Supabase SQL
-- editor. The Supabase SQL editor remains the source of truth for actual
-- execution because we want the operator to see the result row counts.
--
-- Apply order: any time. Idempotent.

create table if not exists public.schema_migrations (
  filename     text        primary key,
  applied_at   timestamptz not null default now(),
  applied_by   text,
  checksum     text,
  notes        text
);

alter table public.schema_migrations enable row level security;

-- Read: any admin. Write: service_role only (CLI uses service role key).
drop policy if exists "Admins can read schema_migrations"
  on public.schema_migrations;
create policy "Admins can read schema_migrations"
  on public.schema_migrations for select
  using (is_admin());

comment on table public.schema_migrations is
  'Records which migration files have been applied. Populated by scripts/migrate.ts after manual SQL editor apply.';
