-- Migration: add reviewer slots to organisations and org_subgroups
-- Run in Supabase SQL editor before deploying the reviewer UI.
--
-- Two reviewer slots per org + two per subgroup.
-- FK references auth.users so the slot goes NULL if the auth account is deleted.

alter table organisations
  add column if not exists reviewer_1_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewer_2_id uuid references auth.users(id) on delete set null;

alter table org_subgroups
  add column if not exists reviewer_1_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewer_2_id uuid references auth.users(id) on delete set null;

-- Indexes for reverse lookups (find all units a user reviews)
create index if not exists orgs_reviewer_1 on organisations(reviewer_1_id) where reviewer_1_id is not null;
create index if not exists orgs_reviewer_2 on organisations(reviewer_2_id) where reviewer_2_id is not null;
create index if not exists subgroups_reviewer_1 on org_subgroups(reviewer_1_id) where reviewer_1_id is not null;
create index if not exists subgroups_reviewer_2 on org_subgroups(reviewer_2_id) where reviewer_2_id is not null;
