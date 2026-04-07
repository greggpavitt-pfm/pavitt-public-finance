-- =============================================================================
-- Migration: Add Phase 2 Advisor tables
-- IPSAS Practitioner Advisor — interactive Q&A system
-- Run this in Supabase SQL Editor if you already have an existing database
-- =============================================================================

-- ============================================================================
-- TABLE: advisor_contexts
-- User's context settings (jurisdiction, entity type, reporting basis, etc.)
-- One row per user (UNIQUE on user_id)
-- ============================================================================

create table if not exists advisor_contexts (
  id                    uuid        primary key default uuid_generate_v4(),
  user_id               uuid        not null unique references profiles(id) on delete cascade,
  jurisdiction          text        default 'Generic IPSAS'
                        check (jurisdiction in (
                          'Solomon Islands',
                          'Papua New Guinea',
                          'Fiji',
                          'Generic IPSAS'
                        )),
  entity_type           text        default 'Central Government'
                        check (entity_type in (
                          'Central Government',
                          'Local Government',
                          'State-Owned Enterprise',
                          'Statutory Authority'
                        )),
  reporting_basis       text        default 'Accrual IPSAS'
                        check (reporting_basis in (
                          'Accrual IPSAS',
                          'Cash Basis IPSAS',
                          'Transitioning to Accrual'
                        )),
  functional_currency   text        default 'USD',
  reporting_period      text,
  output_language       text        default 'en',
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table advisor_contexts enable row level security;

create policy "Users can manage their own context"
  on advisor_contexts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can view all contexts"
  on advisor_contexts for select
  using (is_admin());

create index if not exists advisor_contexts_user_id on advisor_contexts(user_id);

-- ============================================================================
-- TABLE: advisor_conversations
-- Multi-turn Q&A threads (conversations)
-- ============================================================================

create table if not exists advisor_conversations (
  id                 uuid        primary key default uuid_generate_v4(),
  user_id            uuid        not null references profiles(id) on delete cascade,
  title              text        not null,
  output_mode        text        default 'quick_treatment'
                     check (output_mode in ('quick_treatment', 'audit_memo', 'compare_treatments')),
  context_snapshot   jsonb       not null default '{}'::jsonb,
  status             text        default 'active'
                     check (status in ('active', 'archived')),
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table advisor_conversations enable row level security;

create policy "Users can manage their own conversations"
  on advisor_conversations for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can view all conversations"
  on advisor_conversations for select
  using (is_admin());

create index if not exists advisor_conversations_user_id on advisor_conversations(user_id);
create index if not exists advisor_conversations_created_at on advisor_conversations(created_at desc);

-- ============================================================================
-- TABLE: advisor_messages
-- Individual messages within a conversation
-- ============================================================================

create table if not exists advisor_messages (
  id                       uuid        primary key default uuid_generate_v4(),
  conversation_id          uuid        not null references advisor_conversations(id) on delete cascade,
  role                     text        not null
                           check (role in ('user', 'assistant', 'system')),
  content                  text        not null,

  -- Assistant metadata
  citations                jsonb       default '[]'::jsonb,
  topics_matched           text[],
  standards_cited          text[],
  complexity               text        check (complexity in ('Straightforward', 'Moderate', 'Complex')),

  -- Clarifying question support
  clarifying_questions     jsonb       default '[]'::jsonb,
  clarifying_answers       jsonb       default '[]'::jsonb,

  -- Cost tracking
  token_count_in           integer,
  token_count_out          integer,

  created_at               timestamptz default now()
);

alter table advisor_messages enable row level security;

create policy "Users can view their own conversation messages"
  on advisor_messages for select
  using (
    conversation_id in (
      select id from advisor_conversations where user_id = auth.uid()
    )
  );

create policy "Users can insert into their own conversations"
  on advisor_messages for insert
  with check (
    conversation_id in (
      select id from advisor_conversations where user_id = auth.uid()
    )
  );

create policy "Admins can view all messages"
  on advisor_messages for select
  using (is_admin());

create index if not exists advisor_messages_conversation_id on advisor_messages(conversation_id);
create index if not exists advisor_messages_created_at on advisor_messages(created_at);
create index if not exists advisor_messages_role on advisor_messages(role);

-- ============================================================================
-- TABLE: advisor_feedback
-- User feedback on assistant messages
-- ============================================================================

create table if not exists advisor_feedback (
  id           uuid        primary key default uuid_generate_v4(),
  message_id   uuid        not null references advisor_messages(id) on delete cascade,
  user_id      uuid        not null references profiles(id) on delete cascade,
  rating       integer     not null check (rating >= 1 and rating <= 5),
  comment      text,
  created_at   timestamptz default now()
);

alter table advisor_feedback enable row level security;

create policy "Users can manage their own feedback"
  on advisor_feedback for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can view all feedback"
  on advisor_feedback for select
  using (is_admin());

create index if not exists advisor_feedback_message_id on advisor_feedback(message_id);
create index if not exists advisor_feedback_user_id on advisor_feedback(user_id);
create index if not exists advisor_feedback_created_at on advisor_feedback(created_at desc);
