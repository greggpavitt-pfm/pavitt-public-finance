-- Migration: Org-level daily token cap for the practitioner advisor
--
-- Adds two columns to organisations:
--   default_daily_token_limit       — applied to users in the org whose own
--                                      profiles.daily_token_limit is null
--   monthly_token_quota             — soft monthly cap surfaced to admins
--                                      (no hard enforcement yet — for visibility)
--
-- Enforcement chain (from src/app/advisor/actions.ts checkTokenLimit):
--   1. profiles.daily_token_limit  (user-specific override)
--   2. organisations.default_daily_token_limit  (org default)
--   3. hard-coded 100,000          (final fallback)
--
-- null at any level means "inherit from next level."

alter table public.organisations
  add column if not exists default_daily_token_limit integer
    check (default_daily_token_limit is null or default_daily_token_limit > 0);

alter table public.organisations
  add column if not exists monthly_token_quota integer
    check (monthly_token_quota is null or monthly_token_quota > 0);

comment on column public.organisations.default_daily_token_limit is
  'Per-user daily advisor token cap for users whose own daily_token_limit is null. null = inherit final fallback (100,000).';

comment on column public.organisations.monthly_token_quota is
  'Soft monthly token quota for the whole org. Surfaced in admin analytics, not yet enforced.';
