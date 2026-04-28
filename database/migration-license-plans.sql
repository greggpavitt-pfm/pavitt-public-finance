-- Migration: license-plans
--
-- Restructures organisation licensing to support 4 plan types:
--   - beta:       free 14-day pilot (replaces 3-month default in copy)
--   - individual: per-seat per-month, single seat (Phase 2 = Stripe self-signup)
--   - team:       per-seat per-year, org licence (Phase 2 = Stripe)
--   - enterprise: custom, manual admin assignment, manual invoice
--   - expired:    trial or paid sub ended; users suspended
--   - suspended:  admin-suspended (legacy 'suspended' carries over)
--
-- Collapses the legacy `licence_status` (beta|active|expired|suspended) and
-- `trial_status` (requested|active|expired|converted|rejected) into a single
-- `plan_type` enum. No paying customers exist yet so backfill is straightforward.
--
-- Adds Stripe-tracking columns now (populated by Phase 2 webhook), so Phase 1
-- doesn't have to revisit the schema.
--
-- Apply order: AFTER migration-trial-orgs.sql (which adds trial_status).
-- This migration is idempotent on the new columns; the legacy column drop
-- is in a SEPARATE follow-up migration (migration-license-plans-drop-legacy.sql)
-- that runs only after the application code stops reading the old fields.

-- ---------------------------------------------------------------------------
-- 1. Add new columns
-- ---------------------------------------------------------------------------

alter table public.organisations
  add column if not exists plan_type             text,
  add column if not exists billing_period        text,
  add column if not exists stripe_customer_id    text,
  add column if not exists stripe_subscription_id text,
  add column if not exists current_period_end    timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Backfill plan_type + billing_period from existing legacy state
--    (Only test/seed orgs exist; backfill rules are pragmatic, not perfect.)
-- ---------------------------------------------------------------------------

update public.organisations
set plan_type = case
    when trial_status = 'expired'                                     then 'expired'
    when licence_status = 'suspended'                                 then 'suspended'
    when licence_status = 'expired'                                   then 'expired'
    when trial_status = 'active'                                      then 'beta'
    when licence_status = 'active'                                    then 'enterprise' -- pre-existing manual orgs treated as enterprise
    when licence_status = 'beta'                                      then 'beta'
    else 'beta'
  end
where plan_type is null;

update public.organisations
set billing_period = 'none'
where billing_period is null;

-- ---------------------------------------------------------------------------
-- 3. Lock columns NOT NULL + CHECK constraints
-- ---------------------------------------------------------------------------

alter table public.organisations
  alter column plan_type      set not null,
  alter column billing_period set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organisations_plan_type_check'
  ) then
    alter table public.organisations
      add constraint organisations_plan_type_check
      check (plan_type in ('beta','individual','team','enterprise','expired','suspended'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'organisations_billing_period_check'
  ) then
    alter table public.organisations
      add constraint organisations_billing_period_check
      check (billing_period in ('monthly','yearly','none'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Index for active-plan filtering (used by registration + admin lists)
-- ---------------------------------------------------------------------------

create index if not exists organisations_plan_type_idx
  on public.organisations(plan_type);

comment on column public.organisations.plan_type is
  'License plan: beta|individual|team|enterprise|expired|suspended. Replaces legacy licence_status + trial_status.';
comment on column public.organisations.billing_period is
  'Billing cadence: monthly|yearly|none. ''none'' for beta/enterprise/expired/suspended.';
comment on column public.organisations.current_period_end is
  'Stripe subscription current_period_end. Populated by Phase 2 Stripe webhook.';
