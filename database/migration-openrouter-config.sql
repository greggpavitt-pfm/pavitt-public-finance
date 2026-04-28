-- =============================================================================
-- Migration: Add OpenRouter model config + effective date support
-- Supports Phase 2 multi-model LLM routing and IPSAS regulation date filtering
-- Run this in Supabase SQL Editor AFTER migration-advisor-tables.sql
-- =============================================================================

-- ============================================================================
-- TABLE: advisor_model_config
-- Admin-configurable mapping of task types to OpenRouter model IDs.
-- Admins can change which model handles which task without a code deploy.
-- ============================================================================

create table if not exists advisor_model_config (
  id           uuid        primary key default uuid_generate_v4(),
  task_type    text        not null unique
               check (task_type in (
                 'logic_and_drafting',
                 'citation_verification',
                 'summary_for_office'
               )),
  model_id     text        not null,
  display_name text,       -- human-readable label shown in admin UI
  updated_by   uuid        references profiles(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table advisor_model_config enable row level security;

-- All approved users can read (server actions need this to route requests)
create policy "Approved users can read model config"
  on advisor_model_config for select
  using (is_approved());

-- Only admins can update model assignments
create policy "Admins can manage model config"
  on advisor_model_config for all
  using (is_admin())
  with check (is_admin());

-- Seed the default model assignments from the LLM deployment recommendations
insert into advisor_model_config (task_type, model_id, display_name) values
  ('logic_and_drafting',    'deepseek/deepseek-r1',       'DeepSeek R1 — Logic & Drafting'),
  ('citation_verification', 'google/gemini-1.5-flash',    'Gemini 1.5 Flash — Citation Verification'),
  ('summary_for_office',    'openai/gpt-5-nano',          'GPT-5 Nano — Summaries & Popovers')
on conflict (task_type) do nothing;

-- ============================================================================
-- TABLE: ipsas_regulation_metadata
-- Tracks effective dates and status for each IPSAS regulation PDF/chunk set.
-- Used during RAG retrieval to filter out superseded or not-yet-effective regs.
-- ============================================================================

create table if not exists ipsas_regulation_metadata (
  id               uuid        primary key default uuid_generate_v4(),
  standard_id      text        not null,          -- e.g. 'IPSAS-17', 'IPSAS-47', 'C4'
  standard_title   text,                           -- e.g. 'Property, Plant and Equipment'
  effective_date   date        not null,           -- when the regulation becomes/became effective
  superseded_date  date,                           -- null if currently effective
  superseded_by    text,                           -- standard_id of the replacement, if any
  source_pdf       text,                           -- filename or path of the source PDF
  handbook_year    text,                           -- '2024' or '2025' (IPSASB Handbook edition)
  status           text        default 'current'
                   check (status in ('current', 'superseded', 'not_yet_effective')),
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table ipsas_regulation_metadata enable row level security;

-- All approved users can read (RAG pipeline needs this for filtering)
create policy "Approved users can read regulation metadata"
  on ipsas_regulation_metadata for select
  using (is_approved());

-- Only admins can manage regulation metadata
create policy "Admins can manage regulation metadata"
  on ipsas_regulation_metadata for all
  using (is_admin())
  with check (is_admin());

create index if not exists ipsas_reg_standard_id on ipsas_regulation_metadata(standard_id);
create index if not exists ipsas_reg_status on ipsas_regulation_metadata(status);
create index if not exists ipsas_reg_effective_date on ipsas_regulation_metadata(effective_date);

-- ============================================================================
-- Helper view: currently effective regulations only
-- Use this in RAG retrieval queries instead of filtering manually each time
-- ============================================================================

create or replace view ipsas_effective_regulations
with (security_invoker = true)
as
select *
from ipsas_regulation_metadata
where status = 'current'
  and effective_date <= current_date
  and (superseded_date is null or superseded_date > current_date);
