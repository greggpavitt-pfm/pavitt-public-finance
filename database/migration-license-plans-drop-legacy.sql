-- Migration: license-plans-drop-legacy
--
-- Companion to migration-license-plans.sql.
-- Drops the legacy `licence_status` and `trial_status` columns + related
-- constraints/indexes from organisations, after all application code has
-- been updated to read `plan_type` instead.
--
-- DO NOT APPLY until the deploy that switches every code path to plan_type
-- has been merged and is live. Running this earlier will break:
--   - /register (queries .in('licence_status', ['beta','active']))
--   - /auth/actions.ts (same)
--   - /admin/orgs page (selects + reads licence_status)
--   - cron/trial-expiry (filters trial_status='active')
--   - cron/monthly-org-report (.neq('licence_status','expired'))
--
-- Order of operations to apply this migration safely:
--   1. Apply migration-license-plans.sql (adds plan_type, backfills).
--   2. Deploy code that reads/writes plan_type (this PR's code changes).
--   3. Verify production is stable.
--   4. Apply THIS migration (drops legacy columns).

-- ---------------------------------------------------------------------------
-- 1. Drop indexes that reference legacy columns
-- ---------------------------------------------------------------------------

drop index if exists organisations_trial_expires_idx;

-- Recreate the trial-expires index keyed on plan_type='beta' instead.
create index if not exists organisations_trial_expires_idx
  on public.organisations(trial_expires_at)
  where plan_type = 'beta';

-- ---------------------------------------------------------------------------
-- 2. Drop legacy columns (CASCADE drops the column-level CHECK constraints)
-- ---------------------------------------------------------------------------

alter table public.organisations
  drop column if exists licence_status,
  drop column if exists trial_status;
