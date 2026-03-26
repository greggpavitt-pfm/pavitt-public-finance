"use server"
// Admin server actions — approve/suspend users, create orgs.
// ALL of these use createServiceClient() which uses the service_role key and
// bypasses RLS. Each action also verifies the caller is an admin before doing
// anything, so a non-admin user cannot trigger these even if they somehow
// craft a direct POST.

import { revalidatePath } from "next/cache"
import { createClient, createServiceClient } from "@/lib/supabase/server"

// ---------------------------------------------------------------------------
// Helper — verify the calling user is in admin_users
// ---------------------------------------------------------------------------
// Returns the admin row, or throws if the caller is not an admin.
// We use the anon client (user's session) for this check so it goes through
// RLS — the admin_users policy only allows admins to read the table, so a
// non-admin will get back null.

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  // The admin_users RLS policy returns rows only when is_admin() is true,
  // so this will return null for any non-admin user.
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id, role, org_id")
    .eq("id", user.id)
    .single()

  if (!adminRow) throw new Error("Not authorised")

  return { user, adminRow }
}

// ---------------------------------------------------------------------------
// Approve a user
// ---------------------------------------------------------------------------
// Sets account_status = 'approved' and records who approved them and when.

export async function approveUser(userId: string): Promise<{ error?: string }> {
  try {
    const { user } = await requireAdmin()
    const serviceClient = await createServiceClient()

    const { error } = await serviceClient
      .from("profiles")
      .update({
        account_status: "approved",
        approved_by:    user.id,
        approved_at:    new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("approveUser: update failed", { userId, error })
      return { error: error.message }
    }

    revalidatePath("/admin")
    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("approveUser: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Suspend a user
// ---------------------------------------------------------------------------
// Sets account_status = 'suspended'. Middleware will sign them out on next request.

export async function suspendUser(userId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const serviceClient = await createServiceClient()

    const { error } = await serviceClient
      .from("profiles")
      .update({ account_status: "suspended" })
      .eq("id", userId)

    if (error) {
      console.error("suspendUser: update failed", { userId, error })
      return { error: error.message }
    }

    revalidatePath("/admin")
    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("suspendUser: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Create an organisation
// ---------------------------------------------------------------------------
// Called from /admin/orgs. Generates a random licence key if one isn't supplied.

export async function createOrg(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireAdmin()

    const name             = (formData.get("name")             as string | null)?.trim() ?? ""
    const country          = (formData.get("country")          as string | null)?.trim() ?? ""
    const jurisdictionCode = (formData.get("jurisdiction_code") as string | null)?.trim() || null
    const maxUsersRaw      = formData.get("max_users") as string | null
    const maxUsers         = maxUsersRaw ? parseInt(maxUsersRaw, 10) : null

    if (!name || !country) {
      return { error: "Organisation name and country are required." }
    }

    // Generate a readable licence key: PPF-XXXX-XXXX (uppercase alphanumeric)
    const rand = () =>
      Math.random().toString(36).substring(2, 6).toUpperCase()
    const licenceKey = `PPF-${rand()}-${rand()}`

    const serviceClient = await createServiceClient()
    const { error } = await serviceClient
      .from("organisations")
      .insert({
        name,
        country,
        jurisdiction_code: jurisdictionCode,
        licence_key:        licenceKey,
        licence_status:     "active",
        max_users:          maxUsers,
      })

    if (error) {
      // Unique constraint on licence_key — extremely unlikely but handle it
      if (error.message.includes("unique")) {
        return { error: "Licence key collision — please try again." }
      }
      console.error("createOrg: insert failed", { name, error })
      return { error: error.message }
    }

    revalidatePath("/admin/orgs")
    return { success: true }
  } catch (e) {
    console.error("createOrg: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Types shared by report actions
// ---------------------------------------------------------------------------

export type ResultRow = {
  id: string
  user_id: string
  full_name: string
  module_id: string
  module_title: string
  org_id: string | null
  org_name: string | null
  score: number
  passed: boolean
  submitted_at: string
  attempt_number: number
}

// ---------------------------------------------------------------------------
// Get results for an org (org admin report)
// ---------------------------------------------------------------------------
// Org admins see only their own org. Super admins can pass any orgId,
// or null to get all results (use getMasterResults for that).

export async function getOrgResults(orgId?: string): Promise<{
  rows: ResultRow[]
  error?: string
}> {
  try {
    const { adminRow } = await requireAdmin()
    const serviceClient = await createServiceClient()

    // Determine which org(s) to query
    // org_admin is always scoped to their own org
    const targetOrgId = adminRow.role === "org_admin" ? adminRow.org_id : (orgId ?? null)

    // Fetch profiles (limited to org scope)
    let profileQuery = serviceClient
      .from("profiles")
      .select("id, full_name, org_id")

    if (targetOrgId) {
      profileQuery = profileQuery.eq("org_id", targetOrgId)
    }

    const { data: profiles, error: profileError } = await profileQuery
    if (profileError) {
      console.error("getOrgResults: profile fetch failed", { targetOrgId, error: profileError })
      return { rows: [], error: profileError.message }
    }

    if (!profiles || profiles.length === 0) return { rows: [] }

    const userIds = profiles.map((p) => p.id)

    // Fetch assessment results for those users
    const { data: results, error: resultError } = await serviceClient
      .from("assessment_results")
      .select("id, user_id, module_id, score, passed, submitted_at, attempt_number")
      .in("user_id", userIds)
      .order("submitted_at", { ascending: false })

    if (resultError) {
      console.error("getOrgResults: results fetch failed", { targetOrgId, error: resultError })
      return { rows: [], error: resultError.message }
    }
    if (!results || results.length === 0) return { rows: [] }

    // Fetch module titles
    const moduleIds = [...new Set(results.map((r) => r.module_id))]
    const { data: modules } = await serviceClient
      .from("modules")
      .select("id, title")
      .in("id", moduleIds)

    // Fetch org names
    const orgIds = [...new Set(profiles.map((p) => p.org_id).filter(Boolean))]
    const { data: orgs } = await serviceClient
      .from("organisations")
      .select("id, name")
      .in("id", orgIds as string[])

    const profileMap  = new Map(profiles.map((p) => [p.id, p]))
    const moduleMap   = new Map((modules ?? []).map((m) => [m.id, m.title]))
    const orgMap      = new Map((orgs ?? []).map((o) => [o.id, o.name]))

    const rows: ResultRow[] = results.map((r) => {
      const profile = profileMap.get(r.user_id)
      return {
        id:             r.id,
        user_id:        r.user_id,
        full_name:      profile?.full_name ?? "Unknown",
        module_id:      r.module_id,
        module_title:   moduleMap.get(r.module_id) ?? r.module_id,
        org_id:         profile?.org_id ?? null,
        org_name:       profile?.org_id ? (orgMap.get(profile.org_id) ?? null) : null,
        score:          r.score,
        passed:         r.passed,
        submitted_at:   r.submitted_at,
        attempt_number: r.attempt_number,
      }
    })

    return { rows }
  } catch (e) {
    console.error("getOrgResults: unexpected error", e)
    return { rows: [], error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Get all results across all orgs (super admin master report)
// ---------------------------------------------------------------------------

export async function getMasterResults(): Promise<{
  rows: ResultRow[]
  error?: string
}> {
  try {
    const { adminRow } = await requireAdmin()
    if (adminRow.role !== "super_admin") {
      return { rows: [], error: "Super admin access required" }
    }

    // Reuse getOrgResults with no org filter
    return getOrgResults(undefined)
  } catch (e) {
    console.error("getMasterResults: unexpected error", e)
    return { rows: [], error: (e as Error).message }
  }
}
