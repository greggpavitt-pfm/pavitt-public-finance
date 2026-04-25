-- Migration: Daily flashcard email opt-in + SM-2 spaced-repetition schedule
--
-- Adds:
--   profiles.daily_flashcard_email          opt-in flag
--   profiles.daily_flashcard_send_hour_utc  preferred send hour 0-23 (UTC)
--
-- New table flashcard_review_state:
--   one row per (user_id, question_id) for flashcards (question_type='flashcard')
--   tracks SM-2 ease factor, interval days, next_due_date, last_grade
--
-- New table flashcard_email_log:
--   one row per send. Used to dedupe (max one email per user per UTC day) and
--   for delivery diagnostics.

alter table public.profiles
  add column if not exists daily_flashcard_email boolean not null default false;

alter table public.profiles
  add column if not exists daily_flashcard_send_hour_utc integer
    check (daily_flashcard_send_hour_utc is null
           or (daily_flashcard_send_hour_utc between 0 and 23));

create table if not exists public.flashcard_review_state (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor >= 1.30),
  interval_days integer not null default 1 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  last_grade smallint check (last_grade between 0 and 5),
  last_reviewed_at timestamptz,
  next_due_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists idx_flashcard_review_state_due
  on public.flashcard_review_state (user_id, next_due_date);

alter table public.flashcard_review_state enable row level security;

drop policy if exists fc_review_select_own on public.flashcard_review_state;
create policy fc_review_select_own on public.flashcard_review_state
  for select using (user_id = auth.uid());

drop policy if exists fc_review_modify_own on public.flashcard_review_state;
create policy fc_review_modify_own on public.flashcard_review_state
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.flashcard_email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sent_date date not null default current_date,
  question_ids uuid[] not null,
  email_provider_id text,
  status text not null default 'sent' check (status in ('sent','failed','skipped')),
  error_message text,
  created_at timestamptz not null default now(),
  unique (user_id, sent_date)
);

alter table public.flashcard_email_log enable row level security;

-- Only service_role reads/writes the email log; users do not need access.
drop policy if exists fc_email_log_no_user_access on public.flashcard_email_log;
create policy fc_email_log_no_user_access on public.flashcard_email_log
  for select using (false);

comment on column public.profiles.daily_flashcard_email is
  'Opt-in flag. When true and at least one flashcard is due, the daily cron sends a 3-card email.';

comment on column public.profiles.daily_flashcard_send_hour_utc is
  'Preferred send hour 0-23 UTC. null = default cron hour.';

comment on table public.flashcard_review_state is
  'Per-user-per-flashcard SM-2 spaced-repetition schedule. Updated when user grades a card.';

comment on table public.flashcard_email_log is
  'Audit + dedupe record. Unique on (user_id, sent_date) prevents double-sends.';
