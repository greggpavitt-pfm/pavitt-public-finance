-- =============================================================================
-- Migration: add sub_jurisdiction support
-- Run each statement in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Run them in order — later statements depend on earlier ones.
-- =============================================================================

-- 1. Add sub_jurisdiction column to org_subgroups
--    Nullable: not every subgroup needs its own content layer.
ALTER TABLE org_subgroups
  ADD COLUMN sub_jurisdiction text;


-- 2. Add sub_jurisdiction column to modules
--    Nullable: universal and country-level modules leave this null.
--    Sub-layer modules carry a code like 'SIG-TREASURY' that must match
--    the sub_jurisdiction on the user's org_subgroups row.
ALTER TABLE modules
  ADD COLUMN sub_jurisdiction text;


-- 3. Add helper function: my_subgroup_id()
--    Returns the subgroup_id from the calling user's profile (or null).
--    Follows the same security-definer, stable pattern as my_jurisdiction()
--    and my_pathway() defined in schema.sql.
CREATE OR REPLACE FUNCTION my_subgroup_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT subgroup_id FROM profiles WHERE id = auth.uid();
$$;


-- 4. Replace the modules RLS SELECT policy to include sub_jurisdiction check.
--    Logic:
--    - A module with sub_jurisdiction IS NULL is visible to everyone on that pathway/jurisdiction
--    - A module with a sub_jurisdiction code is ONLY visible to users whose
--      subgroup has the matching sub_jurisdiction value
DROP POLICY "Approved users can view matching modules" ON modules;

CREATE POLICY "Approved users can view matching modules"
  ON modules FOR SELECT
  USING (
    (
      is_approved()
      AND pathway = my_pathway()
      AND (jurisdiction IS NULL OR jurisdiction = my_jurisdiction())
      AND (
        sub_jurisdiction IS NULL
        OR sub_jurisdiction IN (
          SELECT sub_jurisdiction
          FROM org_subgroups
          WHERE id = my_subgroup_id()
            AND sub_jurisdiction IS NOT NULL
        )
      )
    )
    OR is_admin()
  );


-- 5. Replace the questions RLS SELECT policy to mirror the modules policy.
--    Questions inherit the same visibility rules as their parent module.
DROP POLICY "Approved users can view questions for their modules" ON questions;

CREATE POLICY "Approved users can view questions for their modules"
  ON questions FOR SELECT
  USING (
    (
      is_approved()
      AND EXISTS (
        SELECT 1 FROM modules m
        WHERE m.id = questions.module_id
          AND m.pathway = my_pathway()
          AND (m.jurisdiction IS NULL OR m.jurisdiction = my_jurisdiction())
          AND (
            m.sub_jurisdiction IS NULL
            OR m.sub_jurisdiction IN (
              SELECT sub_jurisdiction
              FROM org_subgroups
              WHERE id = my_subgroup_id()
                AND sub_jurisdiction IS NOT NULL
            )
          )
      )
    )
    OR is_admin()
  );


-- 6. Replace the modules index to include sub_jurisdiction for query performance.
DROP INDEX IF EXISTS modules_pathway_difficulty_jurisdiction_sequence_number_idx;

CREATE INDEX ON modules (pathway, difficulty, jurisdiction, sub_jurisdiction, sequence_number);
