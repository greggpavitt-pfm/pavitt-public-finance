-- Migration: Re-tag source_tier on ipsas_chunks based on source_pdf path
--
-- The bulk migration script's detect_source_tier() defaulted everything to
-- tier 4 because the ChromaDB metadata's source paths don't include the
-- top-level Documentation/<folder>/ prefix.
--
-- This UPDATE re-classifies based on patterns we know exist in source_pdf
-- and source_url. Tier mapping (from CLAUDE.md):
--   1 - IPSAS_Regulations           (handbook volumes, IPSASB)
--   2 - Downloaded_Standards        (individual standard PDFs)
--   3 - Accounting_Study_Guides     (implementation guides)
--   4 - Accounting_Guidance         (PEFA, conceptual framework, etc.) -- DEFAULT
--   5 - Government-Specific         (jurisdiction overlays, e.g. SIG)
--   6 - Supplementary_Resources     (web sources, blogs, etc.)
--
-- Run after migrate-chroma-to-supabase.py finishes.

-- Tier 1: IPSASB Handbook volumes and official IPSAS Regulations
update public.ipsas_chunks
set source_tier = 1
where lower(coalesce(source_pdf, '')) ~
  '(handbook|ipsasb|ipsas_regulations|ipsasregulations)'
  or lower(coalesce(source_pdf, '')) like '%volume%'
  or lower(coalesce(source_pdf, '')) like '%2024_handbook%'
  or lower(coalesce(source_pdf, '')) like '%2025_handbook%';

-- Tier 2: Individual downloaded standards (filenames like "IPSAS_17.pdf",
-- "IPSAS-23.pdf", "C4_cash_basis.pdf", etc.)
update public.ipsas_chunks
set source_tier = 2
where source_tier = 4
  and lower(coalesce(source_pdf, '')) ~ '(downloaded_standards|^ipsas[_-]?\d+|^c4[_-])';

-- Tier 3: Study guides
update public.ipsas_chunks
set source_tier = 3
where source_tier = 4
  and lower(coalesce(source_pdf, '')) ~ '(study_guide|study-guide|implementation|valuation)';

-- Tier 5: Government-specific (jurisdictional overlays)
update public.ipsas_chunks
set source_tier = 5
where source_tier = 4
  and (
    coalesce(jurisdiction_code, '') <> ''
    or lower(coalesce(source_pdf, '')) ~ '(government[-_]specific|/sig/|solomon|fiji|png)'
  );

-- Tier 6: Web / supplementary
update public.ipsas_chunks
set source_tier = 6
where source_tier = 4
  and (coalesce(source_url, '') <> '' or lower(coalesce(source_pdf, '')) like 'http%');

-- Verification query — useful to run afterwards:
-- select source_tier, count(*) from public.ipsas_chunks group by 1 order by 1;
