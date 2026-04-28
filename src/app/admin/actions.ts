"use server"
// Admin server actions — approve/suspend users, create orgs.
// ALL of these use createServiceClient() which uses the service_role key and
// bypasses RLS. Each action also verifies the caller is an admin before doing
// anything, so a non-admin user cannot trigger these even if they somehow
// craft a direct POST.

import { revalidatePath } from "next/cache"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { createIpsasAdminClient } from "@/lib/supabase/ipsas-admin-client"
import { logAdminAction } from "@/lib/admin/audit"

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

    await logAdminAction({
      actor: user,
      action: "approve_user",
      targetType: "profile",
      targetId: userId,
      after: { account_status: "approved" },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/users")
    revalidatePath("/admin/results")
    return {}
  } catch (e) {
    console.error("approveUser: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Blacklist a user (permanent ban)
// ---------------------------------------------------------------------------
// Sets blacklisted = true and account_status = 'suspended'. The user cannot
// sign in or re-register under the same email. Reversible only by a direct
// DB update — there is intentionally no UI "un-blacklist" action.

export async function blacklistUser(userId: string): Promise<{ error?: string }> {
  try {
    const { user } = await requireAdmin()
    const serviceClient = await createServiceClient()

    const { error } = await serviceClient
      .from("profiles")
      .update({ blacklisted: true, account_status: "suspended" })
      .eq("id", userId)

    if (error) {
      console.error("blacklistUser: update failed", { userId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "blacklist_user",
      targetType: "profile",
      targetId: userId,
      after: { blacklisted: true, account_status: "suspended" },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("blacklistUser: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Update per-product approval flags
// ---------------------------------------------------------------------------
// Admin sets training_approved and practitioner_approved independently.
// Also transitions account_status to 'approved' if at least one is checked,
// or back to 'pending' if both are unchecked and account was pending.

export async function updateUserApprovals(
  userId: string,
  trainingApproved: boolean,
  practitionerApproved: boolean
): Promise<{ error?: string }> {
  try {
    const { user } = await requireAdmin()
    const serviceClient = await createServiceClient()

    // Read current status to decide whether to transition account_status
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("account_status")
      .eq("id", userId)
      .single()

    // Move suspended/pending → approved when at least one product is approved.
    // Don't touch a suspended account's status — that's controlled by suspend/reinstate.
    const shouldSetApproved =
      (trainingApproved || practitionerApproved) &&
      profile?.account_status === "pending"

    const { error } = await serviceClient
      .from("profiles")
      .update({
        training_approved:     trainingApproved,
        practitioner_approved: practitionerApproved,
        ...(shouldSetApproved
          ? { account_status: "approved", approved_by: user.id, approved_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", userId)

    if (error) {
      console.error("updateUserApprovals: update failed", { userId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: trainingApproved || practitionerApproved
        ? "toggle_product_approval"
        : "revoke_product_approval",
      targetType: "profile",
      targetId: userId,
      before: { account_status: profile?.account_status },
      after: {
        training_approved: trainingApproved,
        practitioner_approved: practitionerApproved,
      },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("updateUserApprovals: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Update per-user usage limits
// ---------------------------------------------------------------------------
// null clears the override so the user inherits the org/subgroup default.

export async function updateUserLimits(
  userId: string,
  trainingLimit: number | null,
  practitionerLimit: number | null,
  dailyTokenLimit: number | null = null
): Promise<{ error?: string }> {
  try {
    const { user } = await requireAdmin()
    const serviceClient = await createServiceClient()

    // Bound check on dailyTokenLimit. Practitioner_submission_limit and
    // training_question_limit have similar implicit bounds via their inputs.
    if (dailyTokenLimit != null && (dailyTokenLimit < 0 || dailyTokenLimit > 1_000_000)) {
      return { error: "Daily token limit must be between 0 and 1,000,000" }
    }

    const { error } = await serviceClient
      .from("profiles")
      .update({
        training_question_limit:      trainingLimit,
        practitioner_submission_limit: practitionerLimit,
        daily_token_limit:             dailyTokenLimit,
      })
      .eq("id", userId)

    if (error) {
      console.error("updateUserLimits: update failed", { userId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "change_limits",
      targetType: "profile",
      targetId: userId,
      after: {
        training_question_limit: trainingLimit,
        practitioner_submission_limit: practitionerLimit,
        daily_token_limit: dailyTokenLimit,
      },
    })

    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("updateUserLimits: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Bulk approve — flips account_status='approved' for many users in one call
// ---------------------------------------------------------------------------
// Does NOT auto-grant Training/Practitioner toggles — operator picks those
// after bulk approve. Scoped to caller's org if they are an org_admin.

export async function bulkApproveUsers(userIds: string[]): Promise<{
  error?: string
  approved?: number
}> {
  try {
    const { user, adminRow } = await requireAdmin()
    if (userIds.length === 0) return { approved: 0 }
    if (userIds.length > 500) return { error: "Cannot approve more than 500 users at once" }

    const serviceClient = await createServiceClient()

    // Restrict to caller's org if org_admin. Avoids cross-org approve.
    let updateQuery = serviceClient
      .from("profiles")
      .update({ account_status: "approved" })
      .in("id", userIds)
      .eq("account_status", "pending")  // never resurrect blacklisted/suspended

    if (adminRow.role === "org_admin" && adminRow.org_id) {
      updateQuery = updateQuery.eq("org_id", adminRow.org_id)
    }

    const { data, error } = await updateQuery.select("id")

    if (error) {
      console.error("bulkApproveUsers: update failed", { userIds, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "bulk_approve",
      targetType: "bulk",
      metadata: {
        requested_ids: userIds,
        approved_ids: data?.map((r) => r.id) ?? [],
        approved_count: data?.length ?? 0,
      },
    })

    revalidatePath("/admin/users")
    return { approved: data?.length ?? 0 }
  } catch (e) {
    console.error("bulkApproveUsers: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Renew a guest account (+7 days from today)
// ---------------------------------------------------------------------------

export async function renewGuestAccount(userId: string): Promise<{ error?: string }> {
  try {
    const { user } = await requireAdmin()
    const serviceClient = await createServiceClient()

    const newExpiry = new Date()
    newExpiry.setDate(newExpiry.getDate() + 7)

    const { error } = await serviceClient
      .from("profiles")
      .update({
        guest_expires_at: newExpiry.toISOString(),
        account_status:   "approved",
      })
      .eq("id", userId)
      .eq("account_type", "guest")   // safety: only affect guest accounts

    if (error) {
      console.error("renewGuestAccount: update failed", { userId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "renew_guest",
      targetType: "profile",
      targetId: userId,
      after: { guest_expires_at: newExpiry.toISOString() },
    })

    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("renewGuestAccount: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Cancel a guest account
// ---------------------------------------------------------------------------
// Suspends the guest and clears guest fields so the email can be re-used
// to register a standard account.

export async function cancelGuestAccount(userId: string): Promise<{ error?: string }> {
  try {
    const { user } = await requireAdmin()
    const serviceClient = await createServiceClient()

    const { error } = await serviceClient
      .from("profiles")
      .update({
        account_type:     "standard",
        guest_expires_at: null,
        account_status:   "suspended",
      })
      .eq("id", userId)
      .eq("account_type", "guest")

    if (error) {
      console.error("cancelGuestAccount: update failed", { userId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "cancel_guest",
      targetType: "profile",
      targetId: userId,
    })

    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("cancelGuestAccount: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Reinstate a suspended user
// ---------------------------------------------------------------------------
// Sets account_status back to 'approved'. Records who reinstated and when
// by reusing the approved_by / approved_at columns.

export async function reinstateUser(userId: string): Promise<{ error?: string }> {
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
      console.error("reinstateUser: update failed", { userId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "reinstate_user",
      targetType: "profile",
      targetId: userId,
    })

    revalidatePath("/admin")
    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("reinstateUser: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Suspend a user
// ---------------------------------------------------------------------------
// Sets account_status = 'suspended'. Middleware will sign them out on next request.

export async function suspendUser(userId: string): Promise<{ error?: string }> {
  try {
    const { user } = await requireAdmin()
    const serviceClient = await createServiceClient()

    const { error } = await serviceClient
      .from("profiles")
      .update({ account_status: "suspended" })
      .eq("id", userId)

    if (error) {
      console.error("suspendUser: update failed", { userId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "suspend_user",
      targetType: "profile",
      targetId: userId,
    })

    revalidatePath("/admin")
    revalidatePath("/admin/users")
    revalidatePath("/admin/results")
    return {}
  } catch (e) {
    console.error("suspendUser: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Update an organisation's plan_type (admin)
// ---------------------------------------------------------------------------
// Used to switch enterprise/team/individual/beta/expired/suspended manually.
// Stripe-driven plan changes go through the Phase 2 webhook, not this action.

export async function updateOrgPlan(
  orgId: string,
  planType: string
): Promise<{ error?: string }> {
  try {
    const { user } = await requireAdmin()

    const PLAN_BILLING: Record<string, "monthly" | "yearly" | "none"> = {
      beta: "none",
      individual: "monthly",
      team: "yearly",
      enterprise: "none",
      expired: "none",
      suspended: "none",
    }
    if (!(planType in PLAN_BILLING)) {
      return { error: "Invalid plan type." }
    }

    const serviceClient = await createServiceClient()
    const updates: Record<string, unknown> = {
      plan_type:      planType,
      billing_period: PLAN_BILLING[planType],
    }
    // When flipping to beta, restart the 14-day window so admin can extend trials.
    if (planType === "beta") {
      updates.trial_expires_at = new Date(Date.now() + 14 * 86400 * 1000).toISOString()
    }

    const { error } = await serviceClient
      .from("organisations")
      .update(updates)
      .eq("id", orgId)

    if (error) {
      console.error("updateOrgPlan: failed", { orgId, planType, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "update_org_plan",
      targetType: "organisation",
      targetId: orgId,
      after: { plan_type: planType },
    })

    revalidatePath("/admin/orgs")
    return {}
  } catch (e) {
    console.error("updateOrgPlan: unexpected error", e)
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
    const { user } = await requireAdmin()

    const name           = (formData.get("name")             as string | null)?.trim() ?? ""
    const country        = (formData.get("country")          as string | null)?.trim() ?? ""
    const accountingType = (formData.get("accounting_type")  as string | null)?.trim() || "accrual"
    const planType       = (formData.get("plan_type")        as string | null)?.trim() || "enterprise"
    const maxUsersRaw    = formData.get("max_users") as string | null
    const maxUsers       = maxUsersRaw ? parseInt(maxUsersRaw, 10) : null
    const isDemo         = formData.get("demo") === "true"

    // Plan type defines billing cadence. Beta + enterprise have no Stripe billing.
    const PLAN_BILLING: Record<string, "monthly" | "yearly" | "none"> = {
      beta: "none",
      individual: "monthly",
      team: "yearly",
      enterprise: "none",
      expired: "none",
      suspended: "none",
    }
    if (!(planType in PLAN_BILLING)) {
      return { error: "Invalid plan type." }
    }
    const billingPeriod = PLAN_BILLING[planType]

    // jurisdiction_code only applies to custom accounting type
    const jurisdictionCode = accountingType === "custom"
      ? (formData.get("jurisdiction_code") as string | null)?.trim() || null
      : null

    if (!name || !country) {
      return { error: "Organisation name and country are required." }
    }
    if (!["cash-basis", "accrual", "custom"].includes(accountingType)) {
      return { error: "Invalid accounting type." }
    }
    if (accountingType === "custom" && !jurisdictionCode) {
      return { error: "Jurisdiction code is required for custom accounting type." }
    }

    // Generate a readable licence key: PPF-XXXX-XXXX (uppercase alphanumeric)
    const rand = () =>
      Math.random().toString(36).substring(2, 6).toUpperCase()
    const licenceKey = `PPF-${rand()}-${rand()}`

    const serviceClient = await createServiceClient()
    const { data: inserted, error } = await serviceClient
      .from("organisations")
      .insert({
        name,
        country,
        accounting_type:   accountingType,
        jurisdiction_code: jurisdictionCode,
        demo:              isDemo,
        licence_key:       licenceKey,
        plan_type:         planType,
        billing_period:    billingPeriod,
        // Beta orgs created manually here get a 14-day window from creation
        trial_expires_at:  planType === "beta"
          ? new Date(Date.now() + 14 * 86400 * 1000).toISOString()
          : null,
        max_users:         maxUsers,
      })
      .select("id")
      .single()

    if (error) {
      // Unique constraint on licence_key — extremely unlikely but handle it
      if (error.message.includes("unique")) {
        return { error: "Licence key collision — please try again." }
      }
      console.error("createOrg: insert failed", { name, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "create_org",
      targetType: "organisation",
      targetId: inserted?.id,
      after: { name, country, accounting_type: accountingType, demo: isDemo },
    })

    revalidatePath("/admin/orgs")
    return { success: true }
  } catch (e) {
    console.error("createOrg: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Admin role management (super_admin only)
// ---------------------------------------------------------------------------

export type AdminRow = {
  id: string
  role: "super_admin" | "org_admin"
  org_id: string | null
  org_name: string | null
  full_name: string
  email: string
  created_at: string
}

export async function listAdmins(): Promise<{ admins: AdminRow[]; error?: string }> {
  try {
    const { adminRow } = await requireAdmin()
    if (adminRow.role !== "super_admin") {
      return { admins: [], error: "Super admin access required." }
    }

    const serviceClient = await createServiceClient()

    const { data: rows, error } = await serviceClient
      .from("admin_users")
      .select("id, role, org_id, created_at, organisations ( name )")
      .order("created_at", { ascending: true })

    if (error) return { admins: [], error: error.message }

    const { data: { users: authUsers } } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
    const emailById = new Map(authUsers.map((u) => [u.id, u.email ?? ""]))

    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("id, full_name")
      .in("id", (rows ?? []).map((r) => r.id))

    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))

    const admins: AdminRow[] = (rows ?? []).map((r) => ({
      id: r.id,
      role: r.role as "super_admin" | "org_admin",
      org_id: r.org_id,
      org_name: r.organisations && !Array.isArray(r.organisations)
        ? (r.organisations as { name: string }).name
        : null,
      full_name: nameById.get(r.id) ?? "Unknown",
      email: emailById.get(r.id) ?? "—",
      created_at: r.created_at,
    }))

    return { admins }
  } catch (e) {
    return { admins: [], error: (e as Error).message }
  }
}

export async function grantAdminRole(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user, adminRow } = await requireAdmin()
    if (adminRow.role !== "super_admin") {
      return { error: "Super admin access required." }
    }

    const userId = (formData.get("user_id") as string | null)?.trim() ?? ""
    const role   = (formData.get("role")    as string | null)?.trim() ?? ""
    const orgId  = (formData.get("org_id")  as string | null)?.trim() || null

    if (!userId || !role) return { error: "User and role are required." }
    if (!["super_admin", "org_admin"].includes(role)) return { error: "Invalid role." }
    if (role === "org_admin" && !orgId) return { error: "Org admin requires an organisation." }

    const serviceClient = await createServiceClient()

    // Verify the target user exists and is approved
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id, account_status")
      .eq("id", userId)
      .single()

    if (!profile) return { error: "User not found." }
    if (profile.account_status !== "approved") {
      return { error: "User must be approved before granting admin access." }
    }

    const { error } = await serviceClient
      .from("admin_users")
      .upsert({ id: userId, role, org_id: role === "super_admin" ? null : orgId }, { onConflict: "id" })

    if (error) return { error: error.message }

    await logAdminAction({
      actor: user,
      action: "grant_admin",
      targetType: "admin_user",
      targetId: userId,
      after: { role, org_id: orgId },
    })

    revalidatePath("/admin/admin-users")
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function revokeAdminRole(targetUserId: string): Promise<{ error?: string }> {
  try {
    const { adminRow, user } = await requireAdmin()
    if (adminRow.role !== "super_admin") {
      return { error: "Super admin access required." }
    }
    if (targetUserId === user.id) {
      return { error: "Cannot revoke your own admin access." }
    }

    const serviceClient = await createServiceClient()
    const { error } = await serviceClient
      .from("admin_users")
      .delete()
      .eq("id", targetUserId)

    if (error) return { error: error.message }

    await logAdminAction({
      actor: user,
      action: "revoke_admin",
      targetType: "admin_user",
      targetId: targetUserId,
    })

    revalidatePath("/admin/admin-users")
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Subgroup = {
  id: string
  org_id: string
  name: string
  sub_jurisdiction: string | null
  created_at: string
  reviewer_1_id: string | null
  reviewer_2_id: string | null
}

export type OrgUser = {
  id: string
  full_name: string
  org_id: string
}

// ---------------------------------------------------------------------------
// Create a subgroup within an org
// ---------------------------------------------------------------------------
// super_admin can create for any org; org_admin only for their own org.

export async function createSubgroup(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user, adminRow } = await requireAdmin()

    const orgId         = (formData.get("org_id")          as string | null)?.trim() ?? ""
    const name          = (formData.get("name")             as string | null)?.trim() ?? ""
    const subJurisdiction = (formData.get("sub_jurisdiction") as string | null)?.trim() || null

    if (!orgId || !name) {
      return { error: "Organisation and subgroup name are required." }
    }

    // org_admin can only add subgroups to their own org
    if (adminRow.role === "org_admin" && adminRow.org_id !== orgId) {
      return { error: "Not authorised to add subgroups to this organisation." }
    }

    const serviceClient = await createServiceClient()
    const { data: inserted, error } = await serviceClient
      .from("org_subgroups")
      .insert({ org_id: orgId, name, sub_jurisdiction: subJurisdiction })
      .select("id")
      .single()

    if (error) {
      console.error("createSubgroup: insert failed", { orgId, name, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "create_subgroup",
      targetType: "org_subgroup",
      targetId: inserted?.id,
      metadata: { org_id: orgId, name },
    })

    revalidatePath("/admin/orgs")
    return { success: true }
  } catch (e) {
    console.error("createSubgroup: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Delete a subgroup
// ---------------------------------------------------------------------------
// Refuses to delete if users are still assigned to avoid orphaning profiles.

export async function deleteSubgroup(subgroupId: string): Promise<{ error?: string }> {
  try {
    const { user, adminRow } = await requireAdmin()
    const serviceClient = await createServiceClient()

    // If org_admin, verify the subgroup belongs to their org
    if (adminRow.role === "org_admin") {
      const { data: sg } = await serviceClient
        .from("org_subgroups")
        .select("org_id")
        .eq("id", subgroupId)
        .single()

      if (!sg || sg.org_id !== adminRow.org_id) {
        return { error: "Not authorised to delete this subgroup." }
      }
    }

    // Check no users are assigned — give a friendly error before the DB constraint fires
    const { count } = await serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("subgroup_id", subgroupId)

    if (count && count > 0) {
      return { error: `Cannot delete: ${count} user(s) are still assigned to this subgroup. Reassign them first.` }
    }

    const { error } = await serviceClient
      .from("org_subgroups")
      .delete()
      .eq("id", subgroupId)

    if (error) {
      console.error("deleteSubgroup: delete failed", { subgroupId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "delete_subgroup",
      targetType: "org_subgroup",
      targetId: subgroupId,
    })

    revalidatePath("/admin/orgs")
    return {}
  } catch (e) {
    console.error("deleteSubgroup: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Assign a user to a subgroup (or clear their subgroup)
// ---------------------------------------------------------------------------
// Verifies the subgroup belongs to the same org as the user.

export async function assignUserSubgroup(
  userId: string,
  subgroupId: string | null
): Promise<{ error?: string }> {
  try {
    const { user } = await requireAdmin()
    const serviceClient = await createServiceClient()

    // If assigning (not clearing), verify subgroup belongs to the user's org
    if (subgroupId) {
      const [{ data: profile }, { data: subgroup }] = await Promise.all([
        serviceClient.from("profiles").select("org_id").eq("id", userId).single(),
        serviceClient.from("org_subgroups").select("org_id").eq("id", subgroupId).single(),
      ])

      if (!profile || !subgroup) {
        return { error: "User or subgroup not found." }
      }

      if (profile.org_id !== subgroup.org_id) {
        return { error: "Subgroup does not belong to the user's organisation." }
      }
    }

    const { error } = await serviceClient
      .from("profiles")
      .update({ subgroup_id: subgroupId })
      .eq("id", userId)

    if (error) {
      console.error("assignUserSubgroup: update failed", { userId, subgroupId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "change_subgroup",
      targetType: "profile",
      targetId: userId,
      after: { subgroup_id: subgroupId },
    })

    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("assignUserSubgroup: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Update a user's pathway and ability level (admin only)
// ---------------------------------------------------------------------------
// Allows an admin to correct or change a user's training track after onboarding.

export async function updateUserPathway(
  userId: string,
  pathway: string,
  abilityLevel: string | null
): Promise<{ error?: string }> {
  try {
    const { user } = await requireAdmin()
    const serviceClient = await createServiceClient()

    const { error } = await serviceClient
      .from("profiles")
      .update({
        pathway,
        ability_level: pathway === "accrual" ? abilityLevel : null,
      })
      .eq("id", userId)

    if (error) {
      console.error("updateUserPathway: update failed", { userId, pathway, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "change_pathway",
      targetType: "profile",
      targetId: userId,
      after: { pathway, ability_level: abilityLevel },
    })

    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("updateUserPathway: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Reassign a user to a different organisation (super_admin only)
// ---------------------------------------------------------------------------
// Clears subgroup_id at the same time — the old subgroup is no longer valid.

export async function assignUserOrg(
  userId: string,
  orgId: string
): Promise<{ error?: string }> {
  try {
    const { user, adminRow } = await requireAdmin()

    if (adminRow.role !== "super_admin") {
      return { error: "Super admin access required to reassign organisations." }
    }

    const serviceClient = await createServiceClient()
    const { error } = await serviceClient
      .from("profiles")
      .update({ org_id: orgId, subgroup_id: null })
      .eq("id", userId)

    if (error) {
      console.error("assignUserOrg: update failed", { userId, orgId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "change_org",
      targetType: "profile",
      targetId: userId,
      after: { org_id: orgId },
    })

    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("assignUserOrg: unexpected error", e)
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
  subgroup_id: string | null
  subgroup_name: string | null
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

export async function getOrgResults(orgId?: string, subgroupId?: string): Promise<{
  rows: ResultRow[]
  subgroups: { id: string; name: string }[]
  error?: string
}> {
  try {
    const { adminRow } = await requireAdmin()
    const serviceClient = await createServiceClient()

    // Determine which org(s) to query
    // org_admin is always scoped to their own org
    const targetOrgId = adminRow.role === "org_admin" ? adminRow.org_id : (orgId ?? null)

    // Fetch profiles (limited to org scope), including subgroup_id
    let profileQuery = serviceClient
      .from("profiles")
      .select("id, full_name, org_id, subgroup_id")

    if (targetOrgId) {
      profileQuery = profileQuery.eq("org_id", targetOrgId)
    }

    const { data: profiles, error: profileError } = await profileQuery
    if (profileError) {
      console.error("getOrgResults: profile fetch failed", { targetOrgId, error: profileError })
      return { rows: [], subgroups: [], error: profileError.message }
    }

    if (!profiles || profiles.length === 0) return { rows: [], subgroups: [] }

    // Fetch all subgroups for this org (used for dropdown + name lookup)
    let subgroupQuery = serviceClient
      .from("org_subgroups")
      .select("id, name")
      .order("name")

    if (targetOrgId) {
      subgroupQuery = subgroupQuery.eq("org_id", targetOrgId)
    }

    const { data: subgroupRows } = await subgroupQuery
    const subgroups = subgroupRows ?? []
    const subgroupMap = new Map(subgroups.map((s) => [s.id, s.name]))

    // Apply subgroup filter to profiles if requested
    const filteredProfiles = subgroupId
      ? profiles.filter((p) => p.subgroup_id === subgroupId)
      : profiles

    if (filteredProfiles.length === 0) return { rows: [], subgroups }

    const userIds = filteredProfiles.map((p) => p.id)

    // Fetch assessment results for those users
    const { data: results, error: resultError } = await serviceClient
      .from("assessment_results")
      .select("id, user_id, module_id, score, passed, submitted_at, attempt_number")
      .in("user_id", userIds)
      .order("submitted_at", { ascending: false })

    if (resultError) {
      console.error("getOrgResults: results fetch failed", { targetOrgId, error: resultError })
      return { rows: [], subgroups, error: resultError.message }
    }
    if (!results || results.length === 0) return { rows: [], subgroups }

    // Fetch module titles
    const moduleIds = [...new Set(results.map((r) => r.module_id))]
    const { data: modules } = await serviceClient
      .from("modules")
      .select("id, title")
      .in("id", moduleIds)

    // Fetch org names
    const orgIds = [...new Set(filteredProfiles.map((p) => p.org_id).filter(Boolean))]
    const { data: orgs } = await serviceClient
      .from("organisations")
      .select("id, name")
      .in("id", orgIds as string[])

    const profileMap  = new Map(filteredProfiles.map((p) => [p.id, p]))
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
        subgroup_id:    profile?.subgroup_id ?? null,
        subgroup_name:  profile?.subgroup_id ? (subgroupMap.get(profile.subgroup_id) ?? null) : null,
        score:          r.score,
        passed:         r.passed,
        submitted_at:   r.submitted_at,
        attempt_number: r.attempt_number,
      }
    })

    return { rows, subgroups }
  } catch (e) {
    console.error("getOrgResults: unexpected error", e)
    return { rows: [], subgroups: [], error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Get all results across all orgs (super admin master report)
// ---------------------------------------------------------------------------

export async function getMasterResults(): Promise<{
  rows: ResultRow[]
  subgroups: { id: string; name: string }[]
  error?: string
}> {
  try {
    const { adminRow } = await requireAdmin()
    if (adminRow.role !== "super_admin") {
      return { rows: [], subgroups: [], error: "Super admin access required" }
    }

    // Reuse getOrgResults with no org filter
    return getOrgResults(undefined)
  } catch (e) {
    console.error("getMasterResults: unexpected error", e)
    return { rows: [], subgroups: [], error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Assign / remove a reviewer for an org or subgroup
// ---------------------------------------------------------------------------
// Admins assign up to 2 reviewer users per org and per subgroup. Reviewers
// are regular training users who can see their unit's scores without admin access.

export async function assignOrgReviewer(
  orgId: string,
  slot: 1 | 2,
  userId: string | null
): Promise<{ error?: string }> {
  try {
    const { user, adminRow } = await requireAdmin()
    const serviceClient = await createServiceClient()

    // org_admin can only manage their own org
    if (adminRow.role === "org_admin" && adminRow.org_id !== orgId) {
      return { error: "Not authorised to manage reviewers for this organisation." }
    }

    // Validate the user belongs to this org (if assigning, not clearing)
    if (userId) {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("org_id")
        .eq("id", userId)
        .single()

      if (!profile || profile.org_id !== orgId) {
        return { error: "Selected user does not belong to this organisation." }
      }
    }

    const col = slot === 1 ? "reviewer_1_id" : "reviewer_2_id"
    const { error } = await serviceClient
      .from("organisations")
      .update({ [col]: userId } as Record<string, unknown>)
      .eq("id", orgId)

    if (error) {
      console.error("assignOrgReviewer: update failed", { orgId, slot, userId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "assign_org_reviewer",
      targetType: "organisation",
      targetId: orgId,
      after: { slot, reviewer_user_id: userId },
    })

    revalidatePath("/admin/orgs")
    return {}
  } catch (e) {
    console.error("assignOrgReviewer: unexpected error", e)
    return { error: (e as Error).message }
  }
}

export async function assignSubgroupReviewer(
  subgroupId: string,
  slot: 1 | 2,
  userId: string | null
): Promise<{ error?: string }> {
  try {
    const { user, adminRow } = await requireAdmin()
    const serviceClient = await createServiceClient()

    // Fetch the subgroup to get its org_id for the access check
    const { data: sg } = await serviceClient
      .from("org_subgroups")
      .select("org_id")
      .eq("id", subgroupId)
      .single()

    if (!sg) return { error: "Subgroup not found." }

    if (adminRow.role === "org_admin" && adminRow.org_id !== sg.org_id) {
      return { error: "Not authorised to manage reviewers for this subgroup." }
    }

    // Validate the user belongs to this org (if assigning, not clearing)
    if (userId) {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("org_id")
        .eq("id", userId)
        .single()

      if (!profile || profile.org_id !== sg.org_id) {
        return { error: "Selected user does not belong to this organisation." }
      }
    }

    const col = slot === 1 ? "reviewer_1_id" : "reviewer_2_id"
    const { error } = await serviceClient
      .from("org_subgroups")
      .update({ [col]: userId } as Record<string, unknown>)
      .eq("id", subgroupId)

    if (error) {
      console.error("assignSubgroupReviewer: update failed", { subgroupId, slot, userId, error })
      return { error: error.message }
    }

    await logAdminAction({
      actor: user,
      action: "assign_subgroup_reviewer",
      targetType: "org_subgroup",
      targetId: subgroupId,
      after: { slot, reviewer_user_id: userId },
    })

    revalidatePath("/admin/orgs")
    return {}
  } catch (e) {
    console.error("assignSubgroupReviewer: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// IPSAS Advisor integration — manage regulation subgroups
// ---------------------------------------------------------------------------
// These actions call the IPSAS Supabase project to manage org_subgroups
// used for gating content visibility by sub_jurisdiction codes.

export type IpsasOrg = {
  id: string
  name: string
}

export type IpsasSubgroup = {
  id: string
  org_id: string
  name: string
  sub_jurisdiction: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Get all IPSAS organisations and their regulation subgroups
// ---------------------------------------------------------------------------

export async function getIpsasOrgsAndSubgroups(): Promise<{
  orgs: IpsasOrg[]
  subgroupsByOrg: Map<string, IpsasSubgroup[]>
  error?: string
}> {
  try {
    await requireAdmin()
    const ipsasClient = createIpsasAdminClient()

    // Fetch all orgs
    const { data: orgs, error: orgsError } = await ipsasClient
      .from("organisations")
      .select("id, name")
      .order("name")

    if (orgsError) {
      console.error("getIpsasOrgsAndSubgroups: orgs fetch failed", orgsError)
      return { orgs: [], subgroupsByOrg: new Map(), error: orgsError.message }
    }

    // Fetch all subgroups
    const { data: subgroups, error: subError } = await ipsasClient
      .from("org_subgroups")
      .select("id, org_id, name, sub_jurisdiction, created_at")
      .order("name")

    if (subError) {
      console.error("getIpsasOrgsAndSubgroups: subgroups fetch failed", subError)
      return { orgs: [], subgroupsByOrg: new Map(), error: subError.message }
    }

    // Group subgroups by org_id
    const subgroupsByOrg = new Map<string, IpsasSubgroup[]>()
    for (const sg of subgroups ?? []) {
      const existing = subgroupsByOrg.get(sg.org_id) ?? []
      existing.push(sg)
      subgroupsByOrg.set(sg.org_id, existing)
    }

    return { orgs: orgs ?? [], subgroupsByOrg, error: undefined }
  } catch (e) {
    console.error("getIpsasOrgsAndSubgroups: unexpected error", e)
    return { orgs: [], subgroupsByOrg: new Map(), error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Create a regulation subgroup in IPSAS
// ---------------------------------------------------------------------------

export async function createIpsasSubgroup(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireAdmin()

    const orgId = (formData.get("org_id") as string | null)?.trim() ?? ""
    const name = (formData.get("name") as string | null)?.trim() ?? ""
    const subJurisdiction = (formData.get("sub_jurisdiction") as string | null)?.trim() ?? ""

    if (!orgId || !name || !subJurisdiction) {
      return { error: "Organisation, subgroup name, and sub_jurisdiction code are required." }
    }

    const ipsasClient = createIpsasAdminClient()
    const { error } = await ipsasClient
      .from("org_subgroups")
      .insert({ org_id: orgId, name, sub_jurisdiction: subJurisdiction })

    if (error) {
      console.error("createIpsasSubgroup: insert failed", { orgId, name, error })
      return { error: error.message }
    }

    revalidatePath("/admin/orgs")
    return { success: true }
  } catch (e) {
    console.error("createIpsasSubgroup: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Delete a regulation subgroup from IPSAS
// ---------------------------------------------------------------------------

export async function deleteIpsasSubgroup(subgroupId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const ipsasClient = createIpsasAdminClient()

    const { error } = await ipsasClient
      .from("org_subgroups")
      .delete()
      .eq("id", subgroupId)

    if (error) {
      console.error("deleteIpsasSubgroup: delete failed", { subgroupId, error })
      return { error: error.message }
    }

    revalidatePath("/admin/orgs")
    return {}
  } catch (e) {
    console.error("deleteIpsasSubgroup: unexpected error", e)
    return { error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// DANGER ZONE — Permanent user deletion (super_admin only)
// ---------------------------------------------------------------------------
// Hard-deletes a user from auth.users + profiles + admin_users + clears any
// org_requests references. Intended for test artefacts and accidents only.
//
// Refuses if the user has historical data that would break referential
// meaning (module sessions, assessment results, advisor conversations, or
// any audit log entries where they are the actor). For real users with
// history, use Blacklist instead — that preserves the audit trail.
//
// Refuses on self-delete and on deletion of any super_admin (foot-shoot
// guard). UI requires the operator to type the target email to confirm.

export interface DeleteUserResult {
  error?: string
  blockers?: string[]   // populated when refusing due to historical data
}

export async function deleteUserPermanently(
  userId: string,
  confirmEmail: string,
): Promise<DeleteUserResult> {
  try {
    const { user, adminRow } = await requireAdmin()
    if (adminRow.role !== "super_admin") {
      return { error: "Super admin access required." }
    }
    if (userId === user.id) {
      return { error: "Cannot delete yourself." }
    }

    const serviceClient = await createServiceClient()

    // Resolve the auth user + email so we can verify the typed confirmation.
    const { data: authData, error: authErr } =
      await serviceClient.auth.admin.getUserById(userId)
    if (authErr || !authData?.user) {
      return { error: authErr?.message ?? "Auth user not found." }
    }
    const targetEmail = (authData.user.email ?? "").toLowerCase()
    if (!targetEmail) {
      return { error: "Target user has no email on record — cannot confirm." }
    }
    if (confirmEmail.trim().toLowerCase() !== targetEmail) {
      return { error: "Typed email does not match the target user." }
    }

    // Refuse if target is a super_admin (admin role check).
    const { data: targetAdmin } = await serviceClient
      .from("admin_users")
      .select("role")
      .eq("id", userId)
      .maybeSingle()
    if (targetAdmin?.role === "super_admin") {
      return { error: "Cannot delete a super_admin. Revoke admin role first." }
    }

    // Fetch profile snapshot for the audit log BEFORE deletion.
    const { data: profileSnap } = await serviceClient
      .from("profiles")
      .select("id, full_name, org_id, account_status, account_type, blacklisted, created_at")
      .eq("id", userId)
      .maybeSingle()

    // History check — count rows in tables that hold meaningful user history.
    // Each is a small targeted count query so we can list which one(s) blocked.
    const blockers: string[] = []

    const tablesToCheck: Array<{ table: string; column: string; label: string }> = [
      { table: "module_sessions",       column: "user_id",  label: "module sessions" },
      { table: "assessment_results",    column: "user_id",  label: "assessment results" },
      { table: "advisor_conversations", column: "user_id",  label: "advisor conversations" },
      { table: "admin_audit_log",       column: "actor_id", label: "audit log entries (as actor)" },
    ]
    for (const { table, column, label } of tablesToCheck) {
      const { count, error: countErr } = await serviceClient
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq(column, userId)
      if (countErr) {
        // If a table doesn't exist (e.g. advisor not yet seeded), skip it.
        if (/relation .* does not exist/i.test(countErr.message)) continue
        return { error: `History check failed on ${table}: ${countErr.message}` }
      }
      if ((count ?? 0) > 0) blockers.push(`${count} ${label}`)
    }

    if (blockers.length > 0) {
      return {
        error: "User has historical data — use Blacklist instead of Delete.",
        blockers,
      }
    }

    // Audit log BEFORE deletion (so target_id still resolves and FK is satisfied).
    await logAdminAction({
      actor: user,
      action: "delete_user",
      targetType: "profile",
      targetId: userId,
      before: profileSnap ?? { email: targetEmail },
      metadata: { email: targetEmail },
    })

    // Cascade order: clear org_requests reviewer/approver refs, then
    // admin_users, then profiles, then auth.users.
    // (org_requests.reviewed_by FK to profiles would cascade via SET NULL
    //  if defined that way — but we null it explicitly to be safe across
    //  schemas that may differ.)
    await serviceClient
      .from("org_requests")
      .update({ reviewed_by: null })
      .eq("reviewed_by", userId)

    const { error: adminDelErr } = await serviceClient
      .from("admin_users")
      .delete()
      .eq("id", userId)
    if (adminDelErr) {
      console.warn("deleteUserPermanently: admin_users delete failed", { userId, adminDelErr })
      // Non-fatal — continue.
    }

    const { error: profileDelErr } = await serviceClient
      .from("profiles")
      .delete()
      .eq("id", userId)
    if (profileDelErr) {
      console.error("deleteUserPermanently: profile delete failed", { userId, profileDelErr })
      return { error: profileDelErr.message }
    }

    const { error: authDelErr } = await serviceClient.auth.admin.deleteUser(userId)
    if (authDelErr) {
      console.error("deleteUserPermanently: auth delete failed", { userId, authDelErr })
      return { error: authDelErr.message }
    }

    revalidatePath("/admin")
    revalidatePath("/admin/users")
    return {}
  } catch (e) {
    console.error("deleteUserPermanently: unexpected error", e)
    return { error: (e as Error).message }
  }
}
