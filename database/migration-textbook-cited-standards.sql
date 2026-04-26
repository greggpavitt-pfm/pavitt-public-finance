-- Migration: textbook ingestion support
--
-- Adds three things to the existing ipsas_chunks pipeline:
--   1. source_tier as numeric(2,1) so we can sub-divide tier 4
--      (Bergmann 2015 textbook = 4.0; other ad-hoc guidance = 4.5).
--   2. cited_standards text[] — IPSAS-NN refs detected per chunk at ingest.
--      Lets the retrieval RPC drop chunks whose ENTIRE cited set is
--      superseded (e.g. a textbook chapter that only discusses IPSAS-9,
--      now superseded by IPSAS-47), without losing chunks that mention a
--      superseded standard incidentally alongside current material.
--   3. publication_year — surfaces source age (helpful for the LLM when
--      a 2015 source is the only hit on a topic the standards have since
--      changed).
--
-- The retrieval RPC search_ipsas_chunks is dropped and recreated because
-- the return type changes (source_tier integer → numeric).
--
-- Apply order: after migration-pgvector-ipsas-chunks.sql.

-- ---------------------------------------------------------------------------
-- 1. source_tier: integer → numeric(2,1)   (idempotent — re-runnable)
-- ---------------------------------------------------------------------------

-- Drop the old check constraint first; the new one allows fractional tiers.
alter table public.ipsas_chunks
  drop constraint if exists ipsas_chunks_source_tier_check;

-- Type-change is only applied if column is still integer. Postgres has no
-- "alter column type if not already X" so we guard via information_schema.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ipsas_chunks'
      and column_name = 'source_tier'
      and data_type = 'integer'
  ) then
    alter table public.ipsas_chunks
      alter column source_tier type numeric(2,1)
      using source_tier::numeric(2,1);
  end if;
end $$;

alter table public.ipsas_chunks
  alter column source_tier set default 4.5;

-- Constraint may already exist from a prior run; drop-then-add keeps it
-- consistent with the current bound definition without erroring.
alter table public.ipsas_chunks
  drop constraint if exists ipsas_chunks_source_tier_check;
alter table public.ipsas_chunks
  add constraint ipsas_chunks_source_tier_check
  check (source_tier between 1.0 and 6.0);

-- ---------------------------------------------------------------------------
-- 2. cited_standards (text[]) + GIN index
-- ---------------------------------------------------------------------------

alter table public.ipsas_chunks
  add column if not exists cited_standards text[] not null default '{}';

create index if not exists ipsas_chunks_cited_standards_gin
  on public.ipsas_chunks using gin (cited_standards);

-- ---------------------------------------------------------------------------
-- 3. publication_year
-- ---------------------------------------------------------------------------

alter table public.ipsas_chunks
  add column if not exists publication_year integer;

-- ---------------------------------------------------------------------------
-- 4. Retrieval RPC — drop and recreate with numeric tier + cited_standards filter
-- ---------------------------------------------------------------------------

-- Drop the existing function (return type is changing).
drop function if exists public.search_ipsas_chunks(
  vector, text, text, boolean, integer
);

create function public.search_ipsas_chunks(
  query_embedding vector(1536),
  pathway_filter text default null,
  jurisdiction_filter text default null,
  exclude_superseded boolean default true,
  match_count integer default 20
)
returns table (
  id uuid,
  standard_id text,
  source_pdf text,
  source_url text,
  page_number integer,
  source_tier numeric,
  pathway text,
  jurisdiction_code text,
  text text,
  similarity real,
  cited_standards text[]
)
language sql
stable
security definer
set search_path = public
as $$
  with superseded_set as (
    -- Standards currently considered out-of-scope for retrieval.
    -- Includes both already-superseded and not-yet-effective regulations.
    select standard_id
    from public.ipsas_regulation_metadata
    where status in ('superseded', 'not_yet_effective')
  ),
  candidates as (
    select
      c.id,
      c.standard_id,
      c.source_pdf,
      c.source_url,
      c.page_number,
      c.source_tier,
      c.pathway,
      c.jurisdiction_code,
      c.text,
      c.cited_standards,
      1 - (c.embedding <=> query_embedding) as similarity
    from public.ipsas_chunks c
    where
      c.embedding is not null
      and (pathway_filter is null
           or c.pathway = pathway_filter
           or c.pathway = 'both')
      and (jurisdiction_filter is null
           or c.jurisdiction_code is null
           or c.jurisdiction_code = jurisdiction_filter)
      -- Filter A: chunk's own standard_id is not superseded.
      and (
        not exclude_superseded
        or c.standard_id is null
        or c.standard_id not in (select standard_id from superseded_set)
      )
      -- Filter B: chunk's cited_standards are not ALL superseded.
      -- A chunk that cites IPSAS-9 only is dropped (IPSAS-9 superseded by 47).
      -- A chunk that cites both IPSAS-9 and IPSAS-47 is kept — current cite saves it.
      -- A chunk with no detected cites is always kept (general narrative).
      and (
        not exclude_superseded
        or coalesce(array_length(c.cited_standards, 1), 0) = 0
        or exists (
          select 1
          from unnest(c.cited_standards) cs
          where cs not in (select standard_id from superseded_set)
        )
      )
    order by c.embedding <=> query_embedding
    limit greatest(match_count * 3, 60)
  )
  -- Re-rank: boost by source tier (lower tier = higher authority).
  -- Multiplier formula: similarity * (1 + (6 - tier) * 0.05)
  --   tier 1.0 → +25%, tier 4.0 → +10%, tier 4.5 → +7.5%, tier 6.0 → +0%
  -- Half-tier difference (4.0 vs 4.5) yields a 2.5% rerank gap — small but
  -- decisive when similarities are within a few percent of each other.
  select
    id, standard_id, source_pdf, source_url, page_number,
    source_tier, pathway, jurisdiction_code, text, similarity, cited_standards
  from candidates
  order by similarity * (1.0 + (6 - source_tier) * 0.05) desc
  limit match_count;
$$;

grant execute on function public.search_ipsas_chunks(vector, text, text, boolean, integer)
  to authenticated, service_role;

comment on function public.search_ipsas_chunks is
  'Hybrid IPSAS chunk retrieval: vector similarity + numeric source-tier re-ranking + effective-date filtering on chunk standard_id AND on cited_standards array.';

-- ---------------------------------------------------------------------------
-- 5. Keyword-boost RPC — also returns source_tier, must be recreated to match.
-- ---------------------------------------------------------------------------

drop function if exists public.search_ipsas_chunks_by_standard(
  vector, text, text, boolean, integer
);

create function public.search_ipsas_chunks_by_standard(
  query_embedding vector(1536),
  target_standard_id text,
  pathway_filter text default null,
  exclude_superseded boolean default true,
  match_count integer default 3
) returns table (
  id uuid,
  standard_id text,
  source_pdf text,
  source_url text,
  page_number integer,
  source_tier numeric,
  pathway text,
  jurisdiction_code text,
  text text,
  similarity real,
  cited_standards text[]
) language sql stable as $$
  select
    c.id,
    c.standard_id,
    c.source_pdf,
    c.source_url,
    c.page_number,
    c.source_tier,
    c.pathway,
    c.jurisdiction_code,
    c.text,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.cited_standards
  from public.ipsas_chunks c
  where c.standard_id = target_standard_id
    and (pathway_filter is null or c.pathway = pathway_filter or c.pathway = 'both')
    -- exclude_superseded accepted for API parity; the standard_id is the
    -- explicit target, so superseded filtering would defeat the boost.
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.search_ipsas_chunks_by_standard(vector, text, text, boolean, integer)
  to authenticated, service_role;
