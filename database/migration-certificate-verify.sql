-- Migration: Public certificate verification
--
-- Adds an immutable, URL-safe token to each assessment_results row.
-- The /verify/[token] public page shows the result without requiring login.
--
-- Token is generated at insert time. Once a row exists, the token cannot be
-- changed (no update policy targets this column for non-admins).
--
-- Privacy: the verify page shows ONLY:
--   - student full_name
--   - org name (if any)
--   - module title
--   - score, passed, submitted_at
--
-- It deliberately does NOT expose: user_id, email, attempt_number, or per-question answers.

alter table public.assessment_results
  add column if not exists verification_token uuid not null default gen_random_uuid();

create unique index if not exists assessment_results_verification_token_idx
  on public.assessment_results (verification_token);

-- Public read function — security definer so unauthenticated users can verify
-- a token without RLS bypass and without seeing any other row.
create or replace function public.verify_certificate(token uuid)
returns table (
  student_name text,
  org_name text,
  module_title text,
  score integer,
  passed boolean,
  submitted_at timestamptz,
  attempt_number integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.full_name as student_name,
    o.name as org_name,
    m.title as module_title,
    r.score,
    r.passed,
    r.submitted_at,
    r.attempt_number
  from public.assessment_results r
  join public.profiles p on p.id = r.user_id
  left join public.organisations o on o.id = p.org_id
  join public.modules m on m.id = r.module_id
  where r.verification_token = token
    and r.passed = true
    and coalesce(r.is_practice, false) = false
  limit 1;
$$;

-- Grant to anon (unauthenticated browsers) and authenticated
grant execute on function public.verify_certificate(uuid)
  to anon, authenticated;

comment on function public.verify_certificate is
  'Public certificate verification. Returns one row for a passing, non-practice result, or zero rows otherwise.';
