-- =============================================================================
-- Migration: User Administration — Guest Accounts, Per-Product Approval, Usage Limits
-- Run AFTER migration-usage-log.sql.
--
-- What this adds:
--   1. profiles.account_type          — 'guest' or 'standard'
--   2. profiles.guest_expires_at      — expiry timestamp for guest accounts
--   3. profiles.training_approved     — product-level approval flag
--   4. profiles.practitioner_approved — product-level approval flag
--   5. profiles.blacklisted           — permanent account ban
--   6. profiles.training_question_limit       — per-user 30-day question cap
--   7. profiles.practitioner_submission_limit  — per-user 7-day submission cap
--   8. organisations: default limit columns
--   9. org_subgroups: default limit columns (override org defaults)
--
-- Backfill at end: existing approved users get both product flags set to true
-- so they retain access after migration.
-- =============================================================================


-- =============================================================================
-- profiles — account type and guest expiry
-- =============================================================================

alter table profiles
  add column if not exists account_type text not null default 'standard'
    check (account_type in ('guest', 'standard'));

alter table profiles
  add column if not exists guest_expires_at timestamptz;


-- =============================================================================
-- profiles — per-product approval flags
-- =============================================================================

alter table profiles
  add column if not exists training_approved boolean not null default false;

alter table profiles
  add column if not exists practitioner_approved boolean not null default false;


-- =============================================================================
-- profiles — permanent blacklist
-- =============================================================================

alter table profiles
  add column if not exists blacklisted boolean not null default false;


-- =============================================================================
-- profiles — per-user usage limits
-- =============================================================================
-- null = inherit from subgroup or org default; 0 = explicitly unlimited.

alter table profiles
  add column if not exists training_question_limit integer;

alter table profiles
  add column if not exists practitioner_submission_limit integer;


-- =============================================================================
-- organisations — org-level default limits
-- =============================================================================

alter table organisations
  add column if not exists default_training_question_limit integer;

alter table organisations
  add column if not exists default_practitioner_submission_limit integer;


-- =============================================================================
-- org_subgroups — subgroup-level limit overrides
-- =============================================================================

alter table org_subgroups
  add column if not exists default_training_question_limit integer;

alter table org_subgroups
  add column if not exists default_practitioner_submission_limit integer;


-- =============================================================================
-- org_subgroups — sub_jurisdiction column (if not already added by prior migration)
-- =============================================================================
-- This was added in migration-add-sub-jurisdiction.sql; guard with if not exists.

alter table org_subgroups
  add column if not exists sub_jurisdiction text;


-- =============================================================================
-- Backfill: preserve access for all existing approved users
-- =============================================================================
-- Any user already approved had access to both products (the old model was
-- binary). Set both product flags to true so they are not locked out.

update profiles
  set training_approved     = true,
      practitioner_approved = true
where account_status = 'approved';


-- =============================================================================
-- Index: speed up guest expiry queries (middleware/on-login check)
-- =============================================================================

create index if not exists profiles_guest_expires_at
  on profiles(guest_expires_at)
  where account_type = 'guest';


-- =============================================================================
-- USEFUL QUERIES
-- =============================================================================

-- List all guest accounts and their expiry status:
-- select id, full_name, account_status, guest_expires_at,
--        (guest_expires_at < now()) as expired
-- from profiles
-- where account_type = 'guest'
-- order by guest_expires_at;

-- Find users over their 30-day training question limit:
-- select p.full_name, p.training_question_limit, count(ms.id) as questions_attempted
-- from profiles p
-- left join module_sessions ms on ms.user_id = p.id
--   and ms.submitted_at >= now() - interval '30 days'
-- where p.training_question_limit is not null
-- group by p.id, p.full_name, p.training_question_limit
-- having count(ms.id) >= p.training_question_limit;
