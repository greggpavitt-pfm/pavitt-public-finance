-- =============================================================================
-- Migration: Advisor Usage Log + Configurable Token Quotas
-- Run this in the Supabase SQL Editor AFTER migration-rag-cache.sql.
--
-- What this adds:
--   1. advisor_usage_log        — denormalised row per LLM API call; includes
--                                 user_id, org_id, model, and token counts.
--                                 Designed for fast aggregation queries on the
--                                 upcoming /admin/usage dashboard.
--   2. daily_token_limit column — added to profiles so per-user caps can be
--                                 configured from the admin panel instead of
--                                 being hardcoded in the application.
-- =============================================================================


-- ============================================================================
-- TABLE: advisor_usage_log
-- ============================================================================
-- One row written for every LLM API call made by the Advisor (both the
-- clarifying-questions path and the full treatment path).
--
-- This is deliberately denormalised: org_id and subgroup_id are copied here
-- so that aggregation queries (sum by org, sum by date range) do not need to
-- join through advisor_conversations → profiles → organisations every time.
--
-- Populated by sendMessage() in src/app/advisor/actions.ts.
-- Write is best-effort (does not fail the user request if it errors).

create table if not exists advisor_usage_log (
  id                  uuid        primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),

  -- Who made the call
  user_id             uuid        not null references profiles(id) on delete cascade,
  org_id              uuid        references organisations(id),
  subgroup_id         uuid        references org_subgroups(id),

  -- Which conversation and message this call is linked to
  conversation_id     uuid        references advisor_conversations(id),
  message_id          uuid        references advisor_messages(id),

  -- Which model was used and what kind of task
  model_used          text,       -- e.g. 'deepseek/deepseek-r1'
  task_type           text,       -- e.g. 'logic_and_drafting', 'citation_verification'

  -- Token counts from the OpenRouter response (OpenAI field names)
  prompt_tokens       integer     not null default 0,
  completion_tokens   integer     not null default 0,
  total_tokens        integer     not null default 0,  -- prompt + completion

  -- Optional: estimated cost in USD, calculated from model pricing at call time.
  -- null = not yet calculated; can be backfilled later once pricing data is wired in.
  estimated_cost_usd  numeric(10,6)
);

-- Indexes supporting the planned /admin/usage dashboard queries:

-- "Today's tokens for user X" — used by checkTokenLimit() on every message
create index if not exists advisor_usage_log_user_date
  on advisor_usage_log(user_id, created_at);

-- "All usage for org X in date range" — used by the usage dashboard
create index if not exists advisor_usage_log_org_date
  on advisor_usage_log(org_id, created_at);

-- "All usage for a conversation" — used if we add per-conversation stats
create index if not exists advisor_usage_log_conversation
  on advisor_usage_log(conversation_id);


-- RLS: users can see their own entries; admins can see all.
-- The write (INSERT) is done using the service role key in a Server Action,
-- so no INSERT policy for the authenticated role is needed.
alter table advisor_usage_log enable row level security;

create policy "Users can view their own usage log"
  on advisor_usage_log for select
  using (user_id = auth.uid() or is_admin());


-- ============================================================================
-- COLUMN: profiles.daily_token_limit
-- ============================================================================
-- Replaces the hardcoded 100,000-token daily cap in advisor/actions.ts.
-- Default of 100000 preserves existing behaviour for all current users.
-- Set to a higher/lower value per user from the admin panel or directly in
-- the Supabase SQL editor:
--
--   UPDATE profiles SET daily_token_limit = 50000 WHERE id = '<user-uuid>';
--
-- null = use the platform default (100,000). This is reserved for future use
-- where an org-level budget overrides individual user caps.

alter table profiles
  add column if not exists daily_token_limit integer default 100000;


-- ============================================================================
-- USEFUL QUERIES
-- ============================================================================
-- Run these in the Supabase SQL Editor to monitor usage:

-- 1. Today's token usage by org:
-- select o.name as org, sum(ul.total_tokens) as tokens_today
-- from advisor_usage_log ul
-- join organisations o on o.id = ul.org_id
-- where ul.created_at >= date_trunc('day', now() at time zone 'UTC')
-- group by o.name
-- order by tokens_today desc;

-- 2. Per-user token usage this month:
-- select p.full_name, p.daily_token_limit, sum(ul.total_tokens) as tokens_month
-- from advisor_usage_log ul
-- join profiles p on p.id = ul.user_id
-- where ul.created_at >= date_trunc('month', now() at time zone 'UTC')
-- group by p.full_name, p.daily_token_limit
-- order by tokens_month desc;

-- 3. Which models are being used most:
-- select model_used, count(*) as calls, sum(total_tokens) as total_tokens
-- from advisor_usage_log
-- group by model_used
-- order by total_tokens desc;

-- 4. Check a specific user's daily token consumption:
-- select date_trunc('day', created_at at time zone 'UTC') as day,
--        sum(total_tokens) as tokens
-- from advisor_usage_log
-- where user_id = '<user-uuid>'
-- group by day
-- order by day desc
-- limit 30;
