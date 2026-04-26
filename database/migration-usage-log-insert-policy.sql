-- Migration: insert policy for advisor_usage_log
--
-- The original migration (migration-usage-log.sql) only created a SELECT
-- policy. INSERTs were intended to use the service role (which bypasses RLS),
-- but if the service role key is missing or the client falls back to the
-- anon role, the insert fails with:
--   "new row violates row-level security policy for table advisor_usage_log"
--
-- Adds an explicit insert policy so authenticated users can log their own
-- usage rows. This is also defence-in-depth: if a future call site forgets
-- to use the service role, logging still succeeds.
--
-- Apply order: any time after migration-usage-log.sql.

create policy "Users can insert their own usage log rows"
  on public.advisor_usage_log
  for insert
  to authenticated
  with check (user_id = auth.uid());
