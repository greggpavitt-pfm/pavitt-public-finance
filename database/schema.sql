-- =============================================================================
-- IPSAS Training Platform — Database Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- =============================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";


-- =============================================================================
-- TABLES
-- =============================================================================

-- Organisations are created by an admin before any users can register.
-- The licence_key is shared with the org so their staff can self-register.
create table organisations (
  id                 uuid        primary key default uuid_generate_v4(),
  name               text        not null,
  country            text        not null,
  -- jurisdiction_code drives which overlay content is shown.
  -- null  = universal IPSAS content only
  -- 'SIG' = Solomon Islands Government overlay added on top
  -- 'PNG', 'FJI', etc. can be added later without schema changes
  jurisdiction_code  text,
  licence_key        text        unique not null,
  licence_status     text        not null default 'beta'
                     check (licence_status in ('beta', 'active', 'expired', 'suspended')),
  licence_expires_at timestamptz,          -- null = no expiry (e.g. perpetual beta)
  max_users          integer,              -- null = unlimited seats
  created_at         timestamptz default now()
);

-- Sub-groups within an organisation.
-- e.g. Solomon Islands MoF could have: Treasury, Customs, Provinces Division
create table org_subgroups (
  id         uuid        primary key default uuid_generate_v4(),
  org_id     uuid        not null references organisations(id) on delete cascade,
  name       text        not null,
  created_at timestamptz default now()
);

-- User profiles — extends Supabase's built-in auth.users table.
-- A profile row is created immediately after auth sign-up.
-- account_status starts as 'pending' until an admin approves it.
create table profiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  full_name           text        not null,
  job_title           text,
  org_id              uuid        references organisations(id),
  subgroup_id         uuid        references org_subgroups(id),
  -- pathway + ability_level together determine which module folder is loaded.
  -- ability_level is irrelevant for cash-basis (single level), but stored anyway.
  pathway             text        check (pathway in ('cash-basis', 'accrual')),
  ability_level       text        check (ability_level in ('beginner', 'intermediate', 'advanced')),
  account_status      text        not null default 'pending'
                      check (account_status in ('pending', 'approved', 'suspended')),
  approved_by         uuid        references auth.users(id),
  approved_at         timestamptz,
  onboarding_complete boolean     default false,
  -- Which product(s) this user registered for: 'training', 'advisor', or 'both'.
  -- Used for admin visibility; actual feature access is controlled by account_status.
  product_access      text        not null default 'training'
                      check (product_access in ('training', 'advisor', 'both')),
  created_at          timestamptz default now()
);

-- Admin users — a small table that flags which auth users have admin rights.
-- super_admin: full access to everything
-- org_admin:   can approve/manage users within their own organisation only
create table admin_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'org_admin'
             check (role in ('super_admin', 'org_admin')),
  -- org_admins are scoped to one org; super_admins leave this null
  org_id     uuid references organisations(id),
  created_at timestamptz default now()
);

-- Training modules — the canonical source of truth for all content.
-- Loaded from markdown files via a one-time migration script.
-- id is a human-readable slug, e.g. 'cash-03-receipts-classification'
create table modules (
  id              text        primary key,
  pathway         text        not null check (pathway in ('cash-basis', 'accrual')),
  -- difficulty is null for cash-basis (single level); required for accrual
  difficulty      text        check (difficulty in ('beginner', 'intermediate', 'advanced')),
  sequence_number integer     not null,
  title           text        not null,
  content_md      text        not null,
  -- jurisdiction null = universal content shown to everyone on this pathway
  -- jurisdiction 'SIG' = shown only to users whose org has jurisdiction_code = 'SIG'
  jurisdiction    text,
  standards       text[],     -- e.g. ARRAY['IPSAS-C4', 'IPSAS-1']
  work_areas      text[],     -- e.g. ARRAY['revenue', 'payroll']
  description     text,       -- short summary used in module listing / search
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Questions belong to a module. Supports MCQ and flashcard types.
-- IMPORTANT: correct_answer is never sent to the browser.
-- Column-level privilege (below) blocks the 'authenticated' role from reading it.
-- Answer checking only happens inside a Next.js Server Action using the service_role key.
create table questions (
  id             uuid    primary key default uuid_generate_v4(),
  module_id      text    not null references modules(id) on delete cascade,
  question_text  text    not null,
  question_type  text    not null default 'mcq'
                 check (question_type in ('mcq', 'flashcard')),
  -- MCQ options stored as a JSON array: [{id: "A", text: "..."}, ...]
  options        jsonb,
  -- Correct answer: for MCQ this is the option id ("A", "B", etc.);
  -- for flashcard it is the expected answer text.
  -- This column is REVOKED from the authenticated role — see permissions below.
  correct_answer text    not null,
  -- Explanation shown to the user after they submit an answer
  explanation    text,
  sequence_number integer not null,
  created_at     timestamptz default now()
);

-- Tracks which modules a user has started or completed.
-- One row per user per module; upserted as they progress.
create table progress (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null references profiles(id) on delete cascade,
  module_id    text        not null references modules(id),
  status       text        not null default 'in_progress'
               check (status in ('in_progress', 'completed')),
  completed_at timestamptz,
  unique (user_id, module_id)
);

-- Tracks an in-progress quiz session for a user.
-- Answers are saved incrementally so if the user exits, the session
-- is auto-submitted on next login rather than lost.
-- Only one 'in_progress' session per user+module at a time (enforced by unique constraint).
create table module_sessions (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null references profiles(id) on delete cascade,
  module_id    text        not null references modules(id),
  -- Running list of answers: [{question_id, selected, correct}, ...]
  answers      jsonb       not null default '[]'::jsonb,
  status       text        not null default 'in_progress'
               check (status in ('in_progress', 'submitted')),
  started_at   timestamptz default now(),
  submitted_at timestamptz,
  -- Prevent duplicate active sessions for the same user+module
  unique (user_id, module_id, status)
);

-- Stores the outcome of each assessment attempt.
-- attempt_number increments each time a user re-sits the same module.
-- answers stores per-question detail as JSONB for future item-level analytics.
create table assessment_results (
  id             uuid        primary key default uuid_generate_v4(),
  user_id        uuid        not null references profiles(id) on delete cascade,
  module_id      text        not null references modules(id),
  attempt_number integer     not null default 1,
  score          integer     not null check (score >= 0 and score <= 100),
  -- Example: [{"question_id": "uuid", "selected": "B", "correct": true}, ...]
  answers        jsonb       not null,
  passed         boolean     not null,   -- score >= pass threshold (default 70)
  submitted_at   timestamptz default now()
);


-- =============================================================================
-- HELPER FUNCTIONS
-- Used in RLS policies below. security definer means they run as the owner
-- (postgres), not as the calling user, so they can safely read privileged data.
-- =============================================================================

-- Returns true if the calling user is in the admin_users table
-- stable = result won't change within a single SQL statement (helps query planner)
create or replace function is_admin()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from admin_users where id = auth.uid()
  );
$$;

-- Returns true if the calling user's profile is approved
create or replace function is_approved()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and account_status = 'approved'
  );
$$;

-- Returns the jurisdiction_code for the calling user's organisation (or null)
create or replace function my_jurisdiction()
returns text
language sql security definer stable
as $$
  select o.jurisdiction_code
  from profiles p
  join organisations o on o.id = p.org_id
  where p.id = auth.uid();
$$;

-- Returns the pathway for the calling user
create or replace function my_pathway()
returns text
language sql security definer stable
as $$
  select pathway from profiles where id = auth.uid();
$$;


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Every table is locked down. Users can only see their own data.
-- Admins bypass these policies via the service_role key in server actions.
-- =============================================================================

alter table organisations      enable row level security;
alter table org_subgroups      enable row level security;
alter table profiles           enable row level security;
alter table admin_users        enable row level security;
alter table modules            enable row level security;
alter table questions          enable row level security;
alter table progress           enable row level security;
alter table module_sessions    enable row level security;
alter table assessment_results enable row level security;

-- --- organisations ---

-- Users can read their own org (needed for onboarding UI to show org name)
create policy "Users can view their own organisation"
  on organisations for select
  using (
    id = (select org_id from profiles where id = auth.uid())
    or is_admin()
  );

-- Only admins can create / update / delete orgs
create policy "Admins can manage organisations"
  on organisations for all
  using (is_admin())
  with check (is_admin());

-- NOTE: Licence key validation at registration time is handled server-side
-- via a Server Action using the service_role key (which bypasses RLS).
-- We deliberately do NOT create a public SELECT policy here — that would
-- expose all org names and licence keys to unauthenticated users.


-- --- org_subgroups ---

create policy "Users can view subgroups in their org"
  on org_subgroups for select
  using (
    org_id = (select org_id from profiles where id = auth.uid())
    or is_admin()
  );

create policy "Admins can manage subgroups"
  on org_subgroups for all
  using (is_admin())
  with check (is_admin());


-- --- profiles ---

-- Users can read their own profile; admins can read all
create policy "Users can view own profile"
  on profiles for select
  using (id = auth.uid() or is_admin());

-- Users can insert their own profile row at sign-up
create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Users can update their own profile, but cannot change account_status or approved_by
-- (those fields are admin-only)
create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and account_status = (select account_status from profiles where id = auth.uid())
    and approved_by is not distinct from (select approved_by from profiles where id = auth.uid())
  );

create policy "Admins can manage all profiles"
  on profiles for all
  using (is_admin())
  with check (is_admin());


-- --- admin_users ---

-- Only admins can see or change the admin_users table
create policy "Admins only"
  on admin_users for all
  using (is_admin())
  with check (is_admin());


-- --- modules ---

-- Approved users can see modules that match:
--   1. Their pathway (cash-basis or accrual)
--   2. Universal content (jurisdiction IS NULL) OR their org's jurisdiction
create policy "Approved users can view matching modules"
  on modules for select
  using (
    (
      is_approved()
      and pathway = my_pathway()
      and (jurisdiction is null or jurisdiction = my_jurisdiction())
    )
    or is_admin()
  );

create policy "Admins can manage modules"
  on modules for all
  using (is_admin())
  with check (is_admin());


-- --- questions ---

-- Approved users can read question rows (but NOT the correct_answer column — see below)
create policy "Approved users can view questions for their modules"
  on questions for select
  using (
    (
      is_approved()
      and exists (
        select 1 from modules m
        where m.id = questions.module_id
          and m.pathway = my_pathway()
          and (m.jurisdiction is null or m.jurisdiction = my_jurisdiction())
      )
    )
    or is_admin()
  );

create policy "Admins can manage questions"
  on questions for all
  using (is_admin())
  with check (is_admin());


-- --- progress ---

create policy "Users can manage their own progress"
  on progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can view all progress"
  on progress for select
  using (is_admin());


-- --- module_sessions ---

create policy "Users can manage their own sessions"
  on module_sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can view all sessions"
  on module_sessions for select
  using (is_admin());


-- --- assessment_results ---

create policy "Users can manage their own assessment results"
  on assessment_results for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can view all assessment results"
  on assessment_results for select
  using (is_admin());


-- =============================================================================
-- COLUMN-LEVEL SECURITY
-- RLS controls row access; this controls column access.
-- Revoke sensitive columns from the 'authenticated' role so that even
-- a correctly-formed Supabase client query cannot retrieve them.
-- =============================================================================

-- Prevent users from reading correct answers — checking happens server-side
-- via the service_role key.
revoke select (correct_answer) on questions from authenticated;

-- Prevent users from reading licence keys — validation at registration
-- is handled server-side via the service_role key. Without this, any
-- authenticated user in an org could read the key and share it freely.
revoke select (licence_key) on organisations from authenticated;


-- =============================================================================
-- INDEXES (performance for common queries)
-- =============================================================================

create index on modules (pathway, difficulty, jurisdiction, sequence_number);
create index on questions (module_id, sequence_number);
create index on progress (user_id, module_id);
create index on module_sessions (user_id, module_id, status);
create index on assessment_results (user_id, module_id, attempt_number);
create index on profiles (org_id, account_status);
create index on org_subgroups (org_id);


-- =============================================================================
-- MIGRATION: add product_access column (run once on existing databases)
-- If deploying a fresh schema, this column is already included above.
-- For existing Supabase databases, run this in the SQL editor:
--
--   alter table profiles
--     add column if not exists product_access text not null default 'training'
--     check (product_access in ('training', 'advisor', 'both'));
--
-- =============================================================================

-- =============================================================================
-- SEED: first super-admin
-- After running this schema, create your admin account via Supabase Auth,
-- then run this insert (replace the UUID with your actual auth.users id):
--
--   insert into admin_users (id, role)
--   values ('<your-user-uuid>', 'super_admin');
--
-- Then create the first organisation manually:
--
--   insert into organisations (name, country, jurisdiction_code, licence_key, licence_status)
--   values (
--     'Ministry of Finance — Solomon Islands',
--     'Solomon Islands',
--     'SIG',
--     'PPF-SIG-2025-BETA',   -- change this to something harder to guess
--     'beta'
--   );
-- =============================================================================
