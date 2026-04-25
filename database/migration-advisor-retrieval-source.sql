-- Migration: track retrieval source on advisor_messages
-- Lets admins (and the eval harness) see which retrieval tier produced each
-- assistant response: 'vector', 'keyword-cache', or 'static' (no retrieval).

alter table public.advisor_messages
  add column if not exists retrieval_source text
    check (retrieval_source in ('vector', 'keyword-cache', 'static'));

create index if not exists advisor_messages_retrieval_source_idx
  on public.advisor_messages (retrieval_source);

comment on column public.advisor_messages.retrieval_source is
  'Which retrieval tier produced the context for this assistant response. Null on user/system messages.';
