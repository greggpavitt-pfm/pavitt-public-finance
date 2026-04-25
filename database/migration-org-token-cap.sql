alter table public.organisations
  add column if not exists default_daily_token_limit integer
    check (default_daily_token_limit is null or default_daily_token_limit > 0);

alter table public.organisations
  add column if not exists monthly_token_quota integer
    check (monthly_token_quota is null or monthly_token_quota > 0);

comment on column public.organisations.default_daily_token_limit is
  'Per-user daily advisor token cap for users whose own daily_token_limit is null. null = inherit from the next level.';

comment on column public.organisations.monthly_token_quota is
  'Soft monthly token quota for the whole org. Surfaced in admin analytics, not yet enforced.';
