-- Migration: search_ipsas_chunks_by_standard RPC
--
-- Used by the keyword-boost layer in src/lib/advisor/retrieval.ts.
-- When the user's question contains keywords known to map to a specific
-- standard (e.g. "foreign currency" -> IPSAS-4), we want to surface that
-- standard's most relevant chunks even if vector similarity alone didn't
-- rank them in the top-K.
--
-- This RPC mirrors search_ipsas_chunks but constrains by standard_id and
-- skips the source-tier rerank (the standard_id IS the priority signal).

create or replace function public.search_ipsas_chunks_by_standard(
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
  source_tier integer,
  pathway text,
  jurisdiction_code text,
  text text,
  similarity float
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
    1 - (c.embedding <=> query_embedding) as similarity
  from public.ipsas_chunks c
  where c.standard_id = target_standard_id
    and (pathway_filter is null or c.pathway = pathway_filter or c.pathway = 'both')
    -- exclude_superseded is a no-op until standard_status column is added,
    -- but we accept the parameter for symmetry with search_ipsas_chunks
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
