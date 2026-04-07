-- =============================================================================
-- Migration: Practitioner Section Schema
-- Date: 2026-04-07
-- Description: Creates tables, RLS policies, and indexes for the practitioner
--              toolkit — AI-assisted PFM tools with per-user data isolation.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES (extends Supabase Auth)
-- ---------------------------------------------------------------------------
-- Supabase Auth creates auth.users automatically. This public.profiles table
-- stores additional user metadata and is linked via a trigger on sign-up.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  organization text,
  role        text,                        -- e.g. "government", "donor", "consultant"
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Extended user profiles linked to Supabase Auth.';

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. PRACTITIONER TOOLS (registry of available tools)
-- ---------------------------------------------------------------------------

create table public.practitioner_tools (
  id          text primary key,            -- e.g. "knowledge-assistant"
  name        text not null,
  description text not null,
  category    text not null,               -- e.g. "analysis", "planning", "qa"
  status      text not null default 'active'
                check (status in ('active', 'coming-soon', 'disabled')),
  system_prompt text,                      -- AI system prompt for this tool
  config      jsonb not null default '{}', -- tool-specific settings
  created_at  timestamptz not null default now()
);

comment on table public.practitioner_tools is 'Registry of AI-powered practitioner tools.';

-- Tools are public-readable (anyone can see what tools exist)
alter table public.practitioner_tools enable row level security;

create policy "Tools are publicly readable"
  on public.practitioner_tools for select
  using (true);

-- Seed the three initial tools
insert into public.practitioner_tools (id, name, description, category, system_prompt) values
  (
    'knowledge-assistant',
    'PFM Knowledge Assistant',
    'Conversational Q&A grounded in PFM frameworks (PEFA, IPSAS, budget cycle).',
    'qa',
    'You are a Public Financial Management expert assistant. Answer questions about PFM frameworks, PEFA assessments, IPSAS standards, budget cycles, and reform strategies. Be precise, cite relevant standards or frameworks, and provide practical advice suitable for government officials and development practitioners.'
  ),
  (
    'document-analyzer',
    'Document Analyzer',
    'Upload a fiscal report or budget document for structured analysis and recommendations.',
    'analysis',
    'You are a PFM document analysis expert. Analyze the provided fiscal document and produce: (1) a structured summary, (2) key findings, (3) risk areas, and (4) actionable recommendations. Use PFM terminology accurately and reference relevant international standards where applicable.'
  ),
  (
    'reform-roadmap',
    'Reform Roadmap Generator',
    'Given a country context and reform area, generate a phased reform plan.',
    'planning',
    'You are a PFM reform planning specialist. Given a country context and reform area, generate a detailed, phased reform roadmap. Include: (1) current state assessment questions, (2) quick wins (0-6 months), (3) medium-term reforms (6-24 months), (4) long-term institutional changes (2-5 years), (5) key risks and mitigation strategies. Draw on international best practice and real-world reform experience.'
  );

-- ---------------------------------------------------------------------------
-- 3. TOOL SESSIONS (one per user interaction with a tool)
-- ---------------------------------------------------------------------------

create table public.tool_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tool_id     text not null references public.practitioner_tools(id),
  title       text,                        -- user-editable session title
  metadata    jsonb not null default '{}', -- e.g. country, reform area
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.tool_sessions is 'Individual user sessions with practitioner tools.';

create index idx_tool_sessions_user on public.tool_sessions(user_id);
create index idx_tool_sessions_tool on public.tool_sessions(tool_id);

alter table public.tool_sessions enable row level security;

create policy "Users can read own sessions"
  on public.tool_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create own sessions"
  on public.tool_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.tool_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.tool_sessions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. TOOL MESSAGES (conversation history within a session)
-- ---------------------------------------------------------------------------

create table public.tool_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.tool_sessions(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant', 'system')),
  content     text not null,
  tokens_used integer,                     -- track usage for cost monitoring
  model_used  text,                        -- record which model generated this
  created_at  timestamptz not null default now()
);

comment on table public.tool_messages is 'Conversation messages within a tool session.';

create index idx_tool_messages_session on public.tool_messages(session_id);
create index idx_tool_messages_created on public.tool_messages(session_id, created_at);

alter table public.tool_messages enable row level security;

-- Messages inherit access from their parent session
create policy "Users can read own messages"
  on public.tool_messages for select
  using (
    exists (
      select 1 from public.tool_sessions
      where tool_sessions.id = tool_messages.session_id
        and tool_sessions.user_id = auth.uid()
    )
  );

create policy "Users can create messages in own sessions"
  on public.tool_messages for insert
  with check (
    exists (
      select 1 from public.tool_sessions
      where tool_sessions.id = tool_messages.session_id
        and tool_sessions.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 5. DOCUMENTS (uploaded file metadata — files stored in Supabase Storage)
-- ---------------------------------------------------------------------------

create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  session_id    uuid references public.tool_sessions(id) on delete set null,
  file_name     text not null,
  file_type     text not null,             -- MIME type
  file_size     integer not null,          -- bytes
  storage_path  text not null,             -- path in Supabase Storage bucket
  created_at    timestamptz not null default now()
);

comment on table public.documents is 'Metadata for uploaded documents. Files live in Supabase Storage.';

create index idx_documents_user on public.documents(user_id);

alter table public.documents enable row level security;

create policy "Users can read own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can upload own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. UPDATED_AT TRIGGER (auto-update timestamp on row changes)
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_tool_sessions_updated_at
  before update on public.tool_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. STORAGE BUCKET for practitioner documents
-- ---------------------------------------------------------------------------
-- Note: This must be run via Supabase Dashboard or supabase CLI, not raw SQL.
-- Included here as documentation:
--
-- supabase storage create practitioner-documents --public=false
-- Then add RLS policy: users can only access their own folder (user_id prefix).
