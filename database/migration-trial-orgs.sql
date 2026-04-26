-- Migration: trial-orgs
--
-- Adds trial-tracking columns to organisations and a public-facing
-- org_requests inbox for the /request-demo form.
--
-- Flow:
--   1. Anon visitor submits /request-demo -> insert into org_requests (status='pending')
--   2. Admin reviews on /admin/org-requests
--   3. Admin approves -> creates organisations row (demo=true, trial_status='active',
--      trial_expires_at = now()+14d), creates the contact's profile, sends welcome email,
--      flips org_requests.status='approved' + sets org_id
--   4. Daily cron flips trial_status='expired' for orgs past trial_expires_at and
--      suspends users belonging to them. T-3 / T-1 warning emails go out via the
--      same cron.
--
-- Apply order: any time after the base schema. Idempotent.

-- ---------------------------------------------------------------------------
-- 1. organisations: trial columns
-- ---------------------------------------------------------------------------

alter table public.organisations
  add column if not exists trial_expires_at timestamptz,
  add column if not exists trial_status     text;

-- Add the check constraint separately so re-runs don't error.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organisations_trial_status_check'
  ) then
    alter table public.organisations
      add constraint organisations_trial_status_check
      check (trial_status is null or trial_status in
             ('requested', 'active', 'expired', 'converted', 'rejected'));
  end if;
end $$;

create index if not exists organisations_trial_expires_idx
  on public.organisations(trial_expires_at)
  where trial_status = 'active';

-- ---------------------------------------------------------------------------
-- 2. org_requests: public-submission inbox
-- ---------------------------------------------------------------------------

create table if not exists public.org_requests (
  id              uuid        primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),

  -- Submitted fields
  org_name        text        not null,
  country         text        not null,
  contact_name    text        not null,
  contact_email   text        not null,
  role            text,
  expected_users  integer,
  accounting_type text        check (accounting_type is null
                                     or accounting_type in ('cash-basis', 'accrual', 'custom')),

  -- Workflow
  status          text        not null default 'pending'
                              check (status in ('pending', 'approved', 'rejected')),
  org_id          uuid        references public.organisations(id),  -- set on approve
  notes           text,

  -- Anti-abuse / triage
  source_ip       text,                                  -- recorded at submit time
  reviewed_by     uuid        references public.profiles(id),
  reviewed_at     timestamptz
);

create index if not exists org_requests_status_idx
  on public.org_requests(status, created_at desc);

create index if not exists org_requests_email_idx
  on public.org_requests(lower(contact_email));

-- ---------------------------------------------------------------------------
-- 3. RLS — admin-only reads, anon insert allowed via the server action only
-- ---------------------------------------------------------------------------

alter table public.org_requests enable row level security;

-- Read/update: admins only.
drop policy if exists "Org requests admin read" on public.org_requests;
create policy "Org requests admin read"
  on public.org_requests for select
  using (is_admin());

drop policy if exists "Org requests admin update" on public.org_requests;
create policy "Org requests admin update"
  on public.org_requests for update
  using (is_admin());

-- No insert policy — service_role bypasses RLS, the public submit goes
-- through a server action that uses the service-role client. We do NOT want
-- anon clients writing here directly.

comment on table public.org_requests is
  'Public demo-trial requests. Reviewed by admins; approved rows spawn an organisations row + welcome email.';

-- ---------------------------------------------------------------------------
-- 4. cron_runs: idempotency for the trial-expiry cron (and re-used by T4)
-- ---------------------------------------------------------------------------
-- Prevents the same cron emitting duplicate emails if it runs twice on the
-- same UTC date. (cron_name, run_date) is the natural unique key.

create table if not exists public.cron_runs (
  cron_name  text        not null,
  run_date   date        not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  rows_affected integer,
  notes      text,
  primary key (cron_name, run_date)
);

alter table public.cron_runs enable row level security;

drop policy if exists "Cron runs admin read" on public.cron_runs;
create policy "Cron runs admin read"
  on public.cron_runs for select
  using (is_admin());

comment on table public.cron_runs is
  'Idempotency log for cron handlers. Insert (cron_name, today) at start; duplicate insert means another instance already ran today.';
