-- Migration: Drill Topics
--
-- Adds the 15-topic drill taxonomy as a reference table, then tags
-- questions (and ipsas_chunks) with the drill topic codes they cover.
--
-- Tables/columns added:
--   drill_topics                — reference table, 15 rows seeded separately
--   questions.drill_topic_codes — text[] tagged from module.standards[]
--   ipsas_chunks.drill_topic_codes — text[] for future RAG topic filtering
--
-- Run seed-drill-topics.ts after this migration.
-- Then run tag-questions-with-drill-topics.ts to populate the arrays.

-- ---------------------------------------------------------------------------
-- Drill topics reference table
-- ---------------------------------------------------------------------------

create table if not exists public.drill_topics (
  code            text primary key,
  name            text not null,
  description     text,
  -- pathway: which accounting basis this topic applies to
  pathway         text not null default 'accrual'
                  check (pathway in ('accrual', 'cash-basis', 'both')),
  sequence_number integer not null,
  -- IPSAS standards that map to this topic, e.g. ARRAY['IPSAS-17', 'IPSAS-33']
  standards       text[],
  created_at      timestamptz default now()
);

-- Only approved users may read drill_topics; no writes from client
alter table public.drill_topics enable row level security;

create policy "approved users can read drill_topics"
  on public.drill_topics for select
  using (public.is_approved());

-- ---------------------------------------------------------------------------
-- Tag questions with drill topic codes
-- ---------------------------------------------------------------------------

alter table public.questions
  add column if not exists drill_topic_codes text[] not null default '{}';

-- GIN index for efficient containment queries: drill_topic_codes && ARRAY['DT-01']
create index if not exists idx_questions_drill_topic_codes
  on public.questions using gin(drill_topic_codes);

-- ---------------------------------------------------------------------------
-- Tag ipsas_chunks with drill topic codes (future RAG topic filtering)
-- ---------------------------------------------------------------------------

-- Only add if the ipsas_chunks table exists (created by migration-pgvector-ipsas-chunks.sql)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'ipsas_chunks'
  ) then
    alter table public.ipsas_chunks
      add column if not exists drill_topic_codes text[] not null default '{}';

    create index if not exists idx_ipsas_chunks_drill_topic_codes
      on public.ipsas_chunks using gin(drill_topic_codes);
  end if;
end $$;
