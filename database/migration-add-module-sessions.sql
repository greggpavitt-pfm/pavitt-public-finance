-- =============================================================================
-- Migration: Add module_sessions table
-- Run this in Supabase SQL Editor if you already have an existing database
-- (i.e. schema.sql was already applied without this table)
-- =============================================================================

-- Create the table
create table if not exists module_sessions (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null references profiles(id) on delete cascade,
  module_id    text        not null references modules(id),
  answers      jsonb       not null default '[]'::jsonb,
  status       text        not null default 'in_progress'
               check (status in ('in_progress', 'submitted')),
  started_at   timestamptz default now(),
  submitted_at timestamptz,
  unique (user_id, module_id, status)
);

-- Enable RLS
alter table module_sessions enable row level security;

-- Policies
create policy "Users can manage their own sessions"
  on module_sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can view all sessions"
  on module_sessions for select
  using (is_admin());

-- Index
create index if not exists module_sessions_user_module_status
  on module_sessions (user_id, module_id, status);
