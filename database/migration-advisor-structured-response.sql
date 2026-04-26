-- Migration: structured response storage for the advisor
--
-- The advisor LLM already returns a structured tool-call payload (Recognition,
-- Measurement, Journal Entries, etc.). Until now we serialised that payload
-- into a single markdown string and rendered it in a chat bubble. The new UI
-- decomposes the response into per-section cards (matching the IFRS Copilot
-- layout), so we need to persist the structured payload directly instead of
-- losing it to markdown.
--
-- Adds:
--   structured_response jsonb — full IPSASResponse object including new
--                               fields (journal_entries, practical_notes,
--                               common_errors, key_judgments,
--                               also_relevant_standards). Nullable so
--                               legacy markdown-only messages stay readable.
--
-- The existing `content` column is retained as a markdown fallback so older
-- clients (and any future export-to-PDF flow) can still render without the
-- new card components.
--
-- Apply order: any time after migration-advisor-tables.sql.

alter table public.advisor_messages
  add column if not exists structured_response jsonb;

comment on column public.advisor_messages.structured_response is
  'Full IPSASResponse tool-call payload from the LLM. Used by the card-based renderer; null for legacy messages that only have markdown content.';
