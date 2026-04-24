"use server"
// Reviewer server actions — checking reviewer scope and loading unit results.
//
// getReviewerScope  — checks if the current user is a reviewer for any org/subgroup.
//                     Returns the scope (org or subgroup, with priority to subgroup).
// getUnitResults    — loads all student results for a reviewer's unit.

import { createClient, createServiceClient } from "@/lib/supabase/server"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewerScope =
  | { type: "subgroup"; subgroupId: string; orgId: string; name: string }
  | { type: "org";      orgId: string; name: string }
  | null

export type StudentResult = {
  user_id: string
  full_name: string
  subgroup_id: string | null
  subgroup_name: string | null
  modules: Array<{
    module_id: string
    module_title: string
    score: number
    passed: boolean
    submitted_at: string
    attempt_number: number
  }>
}

// ---------------------------------------------------------------------------
// getReviewerScope
// ---------------------------------------------------------------------------
// Checks whether the current user is assigned as a reviewer for their subgroup
// or org. Subgroup takes priority if assigned at both levels.

export async function getReviewerScope(): Promise<ReviewerScope> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = await createServiceClient()

  // Fetch the user's org and subgroup assignment
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("org_id, subgroup_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) return null

  // Check subgroup first — subgroup scope takes priority
  if (profile.subgroup_id) {
    const { data: sg } = await serviceClient
      .from("org_subgroups")
      .select("id, org_id, name")
      .eq("id", profile.subgroup_id)
      .or(`reviewer_1_id.eq.${user.id},reviewer_2_id.eq.${user.id}`)
      .maybeSingle()

    if (sg) {
      return { type: "subgroup", subgroupId: sg.id, orgId: sg.org_id, name: sg.name }
    }
  }

  // Check org-level reviewer assignment
  const { data: org } = await serviceClient
    .from("organisations")
    .select("id, name")
    .eq("id", profile.org_id)
    .or(`reviewer_1_id.eq.${user.id},reviewer_2_id.eq.${user.id}`)
    .maybeSingle()

  if (org) {
    return { type: "org", orgId: org.id, name: org.name }
  }

  return null
}

// ---------------------------------------------------------------------------
// getUnitResults
// ---------------------------------------------------------------------------
// Loads all students in the reviewer's unit and their assessment results.
// Returns one StudentResult per student, with their latest attempt per module.

export async function getUnitResults(
  scope: NonNullable<ReviewerScope>
): Promise<{ students: StudentResult[]; error?: string }> {
  const serviceClient = await createServiceClient()

  // 1. Fetch profiles in the unit
  let profileQuery = serviceClient
    .from("profiles")
    .select("id, full_name, subgroup_id")
    .order("full_name")

  if (scope.type === "subgroup") {
    profileQuery = profileQuery.eq("subgroup_id", scope.subgroupId)
  } else {
    profileQuery = profileQuery.eq("org_id", scope.orgId)
  }

  const { data: profiles, error: profileError } = await profileQuery
  if (profileError) {
    console.error("getUnitResults: profiles fetch failed", { scope, error: profileError })
    return { students: [], error: profileError.message }
  }
  if (!profiles || profiles.length === 0) return { students: [] }

  // 2. Build subgroup name map (org scope only — subgroup scope has one subgroup)
  const subgroupNameMap = new Map<string, string>()
  if (scope.type === "org") {
    const { data: subgroups } = await serviceClient
      .from("org_subgroups")
      .select("id, name")
      .eq("org_id", scope.orgId)

    for (const sg of subgroups ?? []) {
      subgroupNameMap.set(sg.id, sg.name)
    }
  } else {
    subgroupNameMap.set(scope.subgroupId, scope.name)
  }

  // 3. Fetch assessment results for all users in the unit
  const userIds = profiles.map((p) => p.id)
  const { data: results, error: resultError } = await serviceClient
    .from("assessment_results")
    .select("user_id, module_id, score, passed, submitted_at, attempt_number")
    .in("user_id", userIds)
    .order("submitted_at", { ascending: false })  // latest attempt first

  if (resultError) {
    console.error("getUnitResults: results fetch failed", { scope, error: resultError })
    return { students: [], error: resultError.message }
  }

  // 4. Fetch module titles for all distinct module IDs
  const moduleIds = [...new Set((results ?? []).map((r) => r.module_id))]
  const { data: modules } = moduleIds.length > 0
    ? await serviceClient.from("modules").select("id, title").in("id", moduleIds)
    : { data: [] }

  const moduleTitleMap = new Map((modules ?? []).map((m) => [m.id, m.title]))

  // 5. Group results by user, keeping only the latest attempt per module
  const resultsByUser = new Map<string, typeof results>()
  for (const r of results ?? []) {
    const existing = resultsByUser.get(r.user_id) ?? []
    existing.push(r)
    resultsByUser.set(r.user_id, existing)
  }

  // 6. Assemble StudentResult array
  const students: StudentResult[] = profiles.map((profile) => {
    const userResults = resultsByUser.get(profile.id) ?? []

    // Keep only the latest attempt per module (results are ordered by submitted_at desc)
    const seenModules = new Set<string>()
    const latestPerModule = userResults.filter((r) => {
      if (seenModules.has(r.module_id)) return false
      seenModules.add(r.module_id)
      return true
    })

    return {
      user_id:       profile.id,
      full_name:     profile.full_name,
      subgroup_id:   profile.subgroup_id ?? null,
      subgroup_name: profile.subgroup_id
        ? (subgroupNameMap.get(profile.subgroup_id) ?? null)
        : null,
      modules: latestPerModule.map((r) => ({
        module_id:    r.module_id,
        module_title: moduleTitleMap.get(r.module_id) ?? r.module_id,
        score:        r.score,
        passed:       r.passed,
        submitted_at: r.submitted_at,
        attempt_number: r.attempt_number,
      })),
    }
  })

  return { students }
}
