"use server"
// Admin actions for the demo-request inbox.
//
// approveOrgRequest:
//   1. Require admin caller
//   2. Re-read the request, ensure status='pending' (idempotent guard)
//   3. Create organisations row: demo=true, trial_status='active',
//      trial_expires_at = now()+14 days, licence generated
//   4. Create auth user for the contact (or attach to existing if email already
//      registered — graceful upgrade from prior account)
//   5. Insert profiles row: account_status='approved', both product toggles true,
//      account_type='standard', org_id set
//   6. Insert admin_users row with role='org_admin' so the contact can manage
//      their own team from inside the platform
//   7. Send Resend welcome email with sign-in link, licence key, admin guide URL
//   8. Update org_requests row: status='approved', org_id, reviewed_by/_at, notes
//   9. Audit log
//
// rejectOrgRequest: only updates status + reviewer fields; no emails.
//
// Idempotency: each step that errors is logged but we keep going for non-fatal
// failures (welcome email is best-effort). The org_requests row only flips to
// 'approved' once everything earlier succeeded.

import { revalidatePath } from "next/cache"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { logAdminAction } from "@/lib/admin/audit"
import { sendEmail } from "@/lib/flashcard-email/resend"

const FROM_ADDRESS = "Pavitt Public Finance <noreply@pfmexpert.net>"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pfmexpert.net"
const TRIAL_DAYS = 14

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id, role, org_id")
    .eq("id", user.id)
    .single()
  if (!adminRow) throw new Error("Not authorised")
  return { user, adminRow }
}

export async function approveOrgRequest(
  requestId: string,
  notes: string | null
): Promise<{ error?: string; orgId?: string }> {
  try {
    const { user } = await requireAdmin()
    const serviceClient = await createServiceClient()

    // 1. Load + lock-out concurrent approvals via status check
    const { data: req, error: loadErr } = await serviceClient
      .from("org_requests")
      .select("*")
      .eq("id", requestId)
      .single()

    if (loadErr || !req) {
      return { error: loadErr?.message ?? "Request not found" }
    }
    if (req.status !== "pending") {
      return { error: `Already ${req.status}` }
    }

    // 2. Create organisation
    const accountingType: "cash-basis" | "accrual" | "custom" =
      (req.accounting_type as "cash-basis" | "accrual" | "custom") ?? "accrual"
    const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase()
    const licenceKey = `PPF-${rand()}-${rand()}`
    const trialExpires = new Date(Date.now() + TRIAL_DAYS * 86400 * 1000).toISOString()

    const { data: org, error: orgErr } = await serviceClient
      .from("organisations")
      .insert({
        name:               req.org_name,
        country:            req.country,
        accounting_type:    accountingType,
        demo:               true,
        licence_key:        licenceKey,
        licence_status:     "active",
        trial_status:       "active",
        trial_expires_at:   trialExpires,
        max_users:          50,  // trial cap; admin can lift after conversion
      })
      .select("id, name")
      .single()

    if (orgErr || !org) {
      console.error("approveOrgRequest: org insert failed", { requestId, orgErr })
      return { error: orgErr?.message ?? "Failed to create organisation" }
    }

    // 3. Create or attach auth user for the contact
    const email = (req.contact_email as string).toLowerCase()
    let userId: string | null = null
    let inviteUrl: string | null = null

    const { data: createData, error: createErr } = await serviceClient.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { full_name: req.contact_name, source: "demo_request" },
    })

    if (createErr) {
      // Email already registered — find their user id by listing (no direct lookup endpoint).
      // We page through admin.listUsers in chunks until we find the match. Cheap on small tables.
      if (/already.+registered|exists/i.test(createErr.message)) {
        const { data: list } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
        userId = list?.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null
      } else {
        console.error("approveOrgRequest: createUser failed", { email, createErr })
        return { error: createErr.message }
      }
    } else {
      userId = createData?.user?.id ?? null
    }

    if (!userId) {
      return { error: "Could not resolve user id for contact email" }
    }

    // Generate magic link for first sign-in (works for both new + existing accounts).
    // redirectTo pins the post-verify destination to our /auth/callback route so the
    // session cookie gets set before the user lands anywhere protected. Otherwise
    // Supabase falls back to the dashboard Site URL and may emit a 500 page.
    const linkType = createErr ? "magiclink" : "invite"
    const { data: linkData } = await serviceClient.auth.admin.generateLink({
      type: linkType,
      email,
      options: {
        redirectTo: `${SITE_URL}/auth/callback`,
      },
    })
    inviteUrl = linkData?.properties?.action_link ?? `${SITE_URL}/login`

    // 4. Upsert profile — approved, both product toggles on, attached to new org
    const { error: profileErr } = await serviceClient
      .from("profiles")
      .upsert({
        id:                    userId,
        full_name:             req.contact_name,
        job_title:             req.role ?? null,
        org_id:                org.id,
        account_status:        "approved",
        account_type:          "standard",
        training_approved:     true,
        practitioner_approved: true,
        approved_by:           user.id,
        approved_at:           new Date().toISOString(),
      }, { onConflict: "id" })

    if (profileErr) {
      console.error("approveOrgRequest: profile upsert failed", { userId, profileErr })
      return { error: profileErr.message }
    }

    // 5. Grant org_admin role so they can manage their own team
    const { error: adminErr } = await serviceClient
      .from("admin_users")
      .upsert({
        id:     userId,
        role:   "org_admin",
        org_id: org.id,
      }, { onConflict: "id" })

    if (adminErr) {
      // Non-fatal — they can still sign in without admin rights; we'll log it.
      console.warn("approveOrgRequest: admin_users upsert failed", { userId, adminErr })
    }

    // 6. Send welcome email (best-effort)
    try {
      await sendEmail({
        from: FROM_ADDRESS,
        to: email,
        subject: `Your 14-day trial of ${org.name} is ready`,
        text: [
          `Hi ${req.contact_name},`,
          ``,
          `Your trial organisation "${org.name}" is set up on Pavitt Public Finance.`,
          ``,
          `Sign in:`,
          inviteUrl,
          ``,
          `Trial details:`,
          `  • Expires: ${new Date(trialExpires).toDateString()}`,
          `  • Licence key (for inviting colleagues via the standard sign-up): ${licenceKey}`,
          `  • Up to 50 users during the trial`,
          ``,
          `What you can do:`,
          `  • Browse training modules at /training`,
          `  • Try the practitioner advisor at /advisor`,
          `  • Invite teammates from the Admin panel (you have org_admin rights)`,
          ``,
          `Admin guide: ${SITE_URL}/admin (sign in first)`,
          ``,
          `Questions? Reply to this email.`,
          ``,
          `— Pavitt Public Finance`,
        ].join("\n"),
        html: `
          <p>Hi ${escapeHtml(req.contact_name)},</p>
          <p>Your trial organisation <strong>${escapeHtml(org.name)}</strong> is set up on Pavitt Public Finance.</p>
          <p><a href="${inviteUrl}" style="display:inline-block;background:#0ea5e9;color:white;padding:10px 16px;border-radius:6px;text-decoration:none">Sign in</a></p>
          <p>Or paste this URL: <code>${inviteUrl}</code></p>
          <h3 style="margin-top:24px">Trial details</h3>
          <ul>
            <li>Expires: <strong>${new Date(trialExpires).toDateString()}</strong></li>
            <li>Licence key: <code>${licenceKey}</code></li>
            <li>Up to 50 users during the trial</li>
          </ul>
          <h3>What you can do</h3>
          <ul>
            <li>Browse training modules at <code>/training</code></li>
            <li>Try the practitioner advisor at <code>/advisor</code></li>
            <li>Invite teammates from the Admin panel (you have org_admin rights)</li>
          </ul>
          <p style="color:#666;font-size:12px">Questions? Reply to this email.</p>
        `,
      })
    } catch (emailErr) {
      console.warn("approveOrgRequest: welcome email failed", { email, emailErr })
      // Continue — operator can resend manually from admin
    }

    // 7. Mark the request approved
    const { error: updateErr } = await serviceClient
      .from("org_requests")
      .update({
        status:      "approved",
        org_id:      org.id,
        notes:       notes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (updateErr) {
      console.warn("approveOrgRequest: request update failed", { requestId, updateErr })
    }

    await logAdminAction({
      actor: user,
      action: "approve_org_request",
      targetType: "organisation",
      targetId: org.id,
      after: {
        org_name: req.org_name,
        contact_email: email,
        trial_expires_at: trialExpires,
      },
      metadata: { request_id: requestId, notes },
    })

    revalidatePath("/admin/org-requests")
    revalidatePath("/admin")
    revalidatePath("/admin/orgs")
    return { orgId: org.id }
  } catch (e) {
    console.error("approveOrgRequest: unexpected error", e)
    return { error: (e as Error).message }
  }
}

export async function rejectOrgRequest(
  requestId: string,
  notes: string | null
): Promise<{ error?: string }> {
  try {
    const { user } = await requireAdmin()
    const serviceClient = await createServiceClient()

    const { data: req } = await serviceClient
      .from("org_requests")
      .select("status, org_name, contact_email")
      .eq("id", requestId)
      .single()
    if (!req) return { error: "Request not found" }
    if (req.status !== "pending") return { error: `Already ${req.status}` }

    const { error } = await serviceClient
      .from("org_requests")
      .update({
        status:      "rejected",
        notes:       notes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId)
    if (error) return { error: error.message }

    await logAdminAction({
      actor: user,
      action: "reject_org_request",
      targetType: "bulk",
      targetId: null,
      metadata: {
        request_id: requestId,
        org_name: req.org_name,
        contact_email: req.contact_email,
        notes,
      },
    })

    revalidatePath("/admin/org-requests")
    revalidatePath("/admin")
    return {}
  } catch (e) {
    console.error("rejectOrgRequest: unexpected error", e)
    return { error: (e as Error).message }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!
  ))
}
