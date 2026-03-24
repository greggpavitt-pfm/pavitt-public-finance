-- IPSAS Training Platform — Database Schema
-- Paste this into: Supabase Dashboard > SQL Editor > New query
-- Then click "Run" to create all tables, functions, policies, and indexes.

create extension if not exists "uuid-ossp";


-- TABLES

create table organisations (
  id                 uuid        primary key default uuid_generate_v4(),
  name               text        not null,
  country            text        not null,
  jurisdiction_code  text,
  licence_key        text        unique not null,
  licence_status     text        not null default 'beta' check (licence_status in ('beta', 'active', 'expired', 'suspended')),
  licence_expires_at timestamptz,
  max_users          integer,
  created_at         timestamptz default now()
);

create table org_subgroups (
  id         uuid        primary key default uuid_generate_v4(),
  org_id     uuid        not null references organisations(id) on delete cascade,
  name       text        not null,
  created_at timestamptz default now()
);

create table profiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  full_name           text        not null,
  job_title           text,
  org_id              uuid        references organisations(id),
  subgroup_id         uuid        references org_subgroups(id),
  pathway             text        check (pathway in ('cash-basis', 'accrual')),
  ability_level       text        check (ability_level in ('beginner', 'intermediate', 'advanced')),
  account_status      text        not null default 'pending' check (account_status in ('pending', 'approved', 'suspended')),
  approved_by         uuid        references auth.users(id),
  approved_at         timestamptz,
  onboarding_complete boolean     default false,
  created_at          timestamptz default now()
);

create table admin_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'org_admin' check (role in ('super_admin', 'org_admin')),
  org_id     uuid references organisations(id),
  created_at timestamptz default now()
);

create table modules (
  id              text        primary key,
  pathway         text        not null check (pathway in ('cash-basis', 'accrual')),
  difficulty      text        check (difficulty in ('beginner', 'intermediate', 'advanced')),
  sequence_number integer     not null,
  title           text        not null,
  content_md      text        not null,
  jurisdiction    text,
  standards       text[],
  work_areas      text[],
  description     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table questions (
  id              uuid    primary key default uuid_generate_v4(),
  module_id       text    not null references modules(id) on delete cascade,
  question_text   text    not null,
  question_type   text    not null default 'mcq' check (question_type in ('mcq', 'flashcard')),
  options         jsonb,
  correct_answer  text    not null,
  explanation     text,
  sequence_number integer not null,
  created_at      timestamptz default now()
);

create table progress (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null references profiles(id) on delete cascade,
  module_id    text        not null references modules(id),
  status       text        not null default 'in_progress' check (status in ('in_progress', 'completed')),
  completed_at timestamptz,
  unique (user_id, module_id)
);

create table assessment_results (
  id             uuid        primary key default uuid_generate_v4(),
  user_id        uuid        not null references profiles(id) on delete cascade,
  module_id      text        not null references modules(id),
  attempt_number integer     not null default 1,
  score          integer     not null check (score >= 0 and score <= 100),
  answers        jsonb       not null,
  passed         boolean     not null,
  submitted_at   timestamptz default now()
);


-- HELPER FUNCTIONS

create or replace function is_admin()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from admin_users where id = auth.uid()
  );
$$;

create or replace function is_approved()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and account_status = 'approved'
  );
$$;

create or replace function my_jurisdiction()
returns text
language sql security definer stable
as $$
  select o.jurisdiction_code
  from profiles p
  join organisations o on o.id = p.org_id
  where p.id = auth.uid();
$$;

create or replace function my_pathway()
returns text
language sql security definer stable
as $$
  select pathway from profiles where id = auth.uid();
$$;


-- ROW LEVEL SECURITY

alter table organisations      enable row level security;
alter table org_subgroups      enable row level security;
alter table profiles           enable row level security;
alter table admin_users        enable row level security;
alter table modules            enable row level security;
alter table questions          enable row level security;
alter table progress           enable row level security;
alter table assessment_results enable row level security;

create policy "Users can view their own organisation"
  on organisations for select
  using (
    id = (select org_id from profiles where id = auth.uid())
    or is_admin()
  );

create policy "Admins can manage organisations"
  on organisations for all
  using (is_admin())
  with check (is_admin());

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

create policy "Users can view own profile"
  on profiles for select
  using (id = auth.uid() or is_admin());

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

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

create policy "Admins only"
  on admin_users for all
  using (is_admin())
  with check (is_admin());

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

create policy "Users can manage their own progress"
  on progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can view all progress"
  on progress for select
  using (is_admin());

create policy "Users can manage their own assessment results"
  on assessment_results for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can view all assessment results"
  on assessment_results for select
  using (is_admin());


-- COLUMN-LEVEL SECURITY

revoke select (correct_answer) on questions from authenticated;
revoke select (licence_key) on organisations from authenticated;


-- INDEXES

create index on modules (pathway, difficulty, jurisdiction, sequence_number);
create index on questions (module_id, sequence_number);
create index on progress (user_id, module_id);
create index on assessment_results (user_id, module_id, attempt_number);
create index on profiles (org_id, account_status);
create index on org_subgroups (org_id);
