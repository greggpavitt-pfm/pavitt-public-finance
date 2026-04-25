-- Migration: newsletter_signups
-- Captures email addresses from lead-magnet downloads and newsletter opt-ins.
-- Public-facing — no auth required to insert. Reads are admin-only.

create table if not exists public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'unknown',  -- e.g. 'ipsas-checklist', 'newsletter-footer'
  user_agent text,
  ip_hash text,                              -- SHA-256 of IP for dedup, never raw IP
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid()
);

-- Email + source uniqueness — one signup per email per source
create unique index if not exists newsletter_signups_email_source_idx
  on public.newsletter_signups (lower(email), source);

create index if not exists newsletter_signups_consented_at_idx
  on public.newsletter_signups (consented_at desc);

-- Enable RLS — only admins can read; inserts go through service role key
alter table public.newsletter_signups enable row level security;

-- No public read policy — admins use service_role from server actions

-- Admin read policy
create policy "admins can read newsletter signups"
  on public.newsletter_signups
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.id = auth.uid()
    )
  );

-- Inserts must go through server action with service role
-- (no public insert policy — service role bypasses RLS)
