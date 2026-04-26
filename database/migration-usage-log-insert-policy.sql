-- Migration: insert policy for advisor_usage_log
--
-- The original migration (migration-usage-log.sql) only created a SELECT
-- policy. Inserts are intended to use the service role (which bypasses RLS)
-- via serviceClient.from("advisor_usage_log").insert(...) in
-- src/app/advisor/actions.ts. If the SUPABASE_SERVICE_ROLE_KEY env is
-- missing the client falls back to the anon role and the insert fails:
--   "new row violates row-level security policy for table advisor_usage_log"
--
-- This policy is DEFENCE-IN-DEPTH ONLY: it lets an authed-user fallback
-- still log usage, BUT validates every cost/billing-sensitive column so a
-- malicious user cannot poison usage analytics by spoofing org_id, inflating
-- token counts, etc.
--
-- The legitimate write path is service-role and bypasses these checks.
--
-- Apply order: any time after migration-usage-log.sql.
-- Idempotent: drop-then-create.

drop policy if exists "Users can insert their own usage log rows"
  on public.advisor_usage_log;

create policy "Users can insert own usage rows with validated fields"
  on public.advisor_usage_log
  for insert
  to authenticated
  with check (
    -- Owner identity: row must belong to the calling user.
    user_id = auth.uid()

    -- org_id must match the user's actual org membership (or be null).
    -- Prevents cross-org billing attribution attacks.
    and (
      org_id is null
      or org_id = (select org_id from public.profiles where id = auth.uid())
    )

    -- Token-count sanity bounds. Real OpenRouter responses fit comfortably.
    -- Values outside these ranges indicate spoofing.
    and prompt_tokens between 0 and 200000
    and completion_tokens between 0 and 200000
    and total_tokens between 0 and 400000

    -- Cost (if provided by caller) must be plausible. null is allowed —
    -- migration-usage-log.sql notes this column is backfilled later.
    and (estimated_cost_usd is null or estimated_cost_usd between 0 and 10)

    -- created_at must be recent (no back-dating to dodge daily caps).
    -- 5-minute past tolerance for clock skew; no future writes.
    and created_at >= now() - interval '5 minutes'
    and created_at <= now() + interval '1 minute'
  );

comment on policy "Users can insert own usage rows with validated fields"
  on public.advisor_usage_log is
  'Defence-in-depth fallback. Legitimate path uses service role and bypasses RLS. This policy validates owner identity, org membership, token-count bounds, and recency to prevent spoofing if a call site accidentally falls back to the authenticated role.';
