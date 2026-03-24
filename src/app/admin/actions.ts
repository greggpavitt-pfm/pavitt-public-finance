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

    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath("/admin/users")
    return {}
  } catch (e) {
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

    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath("/admin/users")
    return {}
  } catch (e) {
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
      return { error: error.message }
    }

    revalidatePath("/admin/orgs")
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
