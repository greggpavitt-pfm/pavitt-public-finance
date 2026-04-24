-- =============================================================================
-- Migration: advisor_documents — PDF uploads linked to conversations
-- Run this in Supabase SQL Editor AFTER migration-advisor-tables.sql
-- =============================================================================

create table if not exists advisor_documents (
  id                    uuid        primary key default uuid_generate_v4(),

  -- Which user uploaded this document
  user_id               uuid        not null references profiles(id) on delete cascade,

  -- Which conversation this document belongs to
  conversation_id       uuid        not null references advisor_conversations(id) on delete cascade,

  -- Original filename shown in the UI (e.g. "Budget-Report-2025.pdf")
  original_filename     text        not null,

  -- File size in bytes (validated server-side — max 4 MB)
  file_size_bytes       integer     not null,

  -- Path inside the 'advisor-documents' Supabase Storage bucket.
  -- Format: {user_id}/{conversation_id}/{uuid}.pdf
  -- Always forward slashes — never Windows-style backslashes.
  storage_path          text        not null,

  -- Text extracted by pdf-parse at upload time.
  -- Null if the PDF is scanned / image-only (no embedded text layer).
  -- Capped at 50,000 characters before storage to control prompt token usage.
  extracted_text        text,

  -- How many characters were extracted before the 50,000-char cap was applied.
  -- Null means extraction failed.
  extracted_char_count  integer,

  -- Upload pipeline status:
  --   'processing' — file uploaded to storage, extraction in progress
  --   'ready'      — extraction complete, text is available for LLM context
  --   'failed'     — extraction failed (scanned PDF, corrupt file, etc.)
  status                text        not null default 'processing'
                        check (status in ('processing', 'ready', 'failed')),

  created_at            timestamptz not null default now()
);

alter table advisor_documents enable row level security;

-- Users can only see documents they uploaded
create policy "Users can view their own documents"
  on advisor_documents for select
  using (user_id = auth.uid());

-- INSERT is done via the service role key in the API route — no authenticated INSERT policy needed.

-- Users can delete their own documents
create policy "Users can delete their own documents"
  on advisor_documents for delete
  using (user_id = auth.uid());

-- Admins can view all documents for support/audit purposes
create policy "Admins can view all documents"
  on advisor_documents for select
  using (is_admin());

-- Indexes for fast lookups by conversation and by user
create index if not exists advisor_documents_conversation_id
  on advisor_documents(conversation_id);

create index if not exists advisor_documents_user_id
  on advisor_documents(user_id);


-- =============================================================================
-- Storage RLS — run AFTER creating the 'advisor-documents' bucket in the
-- Supabase Dashboard (Storage → New Bucket → Name: advisor-documents, Private)
-- =============================================================================

-- Storage path format: {user_id}/{conversation_id}/{uuid}.pdf
-- The first path segment must match the authenticated user's ID.

create policy "Users can read their own advisor documents"
  on storage.objects for select
  using (
    bucket_id = 'advisor-documents'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "Users can delete their own advisor documents"
  on storage.objects for delete
  using (
    bucket_id = 'advisor-documents'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- INSERT is handled server-side with the service role key — no authenticated INSERT policy.
