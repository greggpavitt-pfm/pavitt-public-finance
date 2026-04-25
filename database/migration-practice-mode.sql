-- Migration: Practice Mode for module sessions
--
-- Lets learners take a module in unlimited-retry "practice" mode. Practice
-- attempts use the same question bank but do NOT count toward grading,
-- certificate eligibility, or org-level analytics.
--
-- Existing graded attempts remain one-shot — the integrity of certificates
-- depends on this and is preserved.
--
-- New columns:
--   module_sessions.is_practice    boolean (default false)
--   assessment_results.is_practice boolean (default false) — copied from session
--
-- The unique constraint on module_sessions(user_id, module_id, status) is
-- replaced with a partial unique index so practice-in-progress sessions don't
-- block a graded-in-progress session for the same user+module.

alter table public.module_sessions
  add column if not exists is_practice boolean not null default false;

alter table public.assessment_results
  add column if not exists is_practice boolean not null default false;

-- Drop the old unique constraint and replace with two partial indexes:
--   one for graded sessions (max one in_progress per user+module)
--   one for practice sessions (max one in_progress per user+module)
alter table public.module_sessions
  drop constraint if exists module_sessions_user_id_module_id_status_key;

create unique index if not exists module_sessions_one_active_graded_idx
  on public.module_sessions (user_id, module_id)
  where status = 'in_progress' and is_practice = false;

create unique index if not exists module_sessions_one_active_practice_idx
  on public.module_sessions (user_id, module_id)
  where status = 'in_progress' and is_practice = true;

-- Index for filtering analytics
create index if not exists module_sessions_is_practice_idx
  on public.module_sessions (is_practice);

create index if not exists assessment_results_is_practice_idx
  on public.assessment_results (is_practice);

comment on column public.module_sessions.is_practice is
  'true = unlimited-retry practice mode; excluded from grading aggregates and certificate eligibility.';

comment on column public.assessment_results.is_practice is
  'Copied from module_sessions.is_practice at submission time. Practice results never count toward certificates.';
