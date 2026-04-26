"use server"
// CSV pre-provisioning for admin user invites.
//
// Operator pastes a CSV in the admin UI and submits. For each row we:
//   1. Validate email + parse fields
//   2. Skip if a profiles row already exists for that email
//   3. Create the auth user (auth.admin.createUser) — generates a magic-link
//      invite via Supabase email
//   4. Create the profiles row with org/subgroup pre-assigned, status=pending
//   5. Send a Resend welcome email with sign-in instructions
//
// Each new user starts with both product toggles FALSE — operator decides
// access after they appear in the user list.

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/flashcard-email/resend"

interface CsvRow {
  email: string
  full_name: string
  job_title?: string
}

export interface InviteResult {
  created: number
  skipped: number
  errors: string[]
}

const FROM_ADDRESS = "Pavitt Public Finance <noreply@pfmexpert.net>"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pfmexpert.net"

// Loose check — Supabase auth will reject anything truly malformed at create.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseCsv(csv: string): { rows: CsvRow[]; errors: string[] } {
  const rows: CsvRow[] = []
  const errors: string[] = []
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return { rows, errors: ["Empty CSV"] }

  // First line may be a header — skip if it contains "email"
  const startIdx = /email/i.test(lines[0]) ? 1 : 0
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim())
    const [email, full_name, job_title] = cols
    if (!email || !EMAIL_RE.test(email)) {
      errors.push(`Line ${i + 1}: invalid email "${email ?? ""}"`)
      continue
    }
    if (!full_name) {
      errors.push(`Line ${i + 1}: missing full_name`)
      continue
    }
    rows.push({ email: email.toLowerCase(), full_name, job_title })
  }
  return { rows, errors }
}

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

export async function inviteByCsv(
  csv: string,
  orgId: string,
  subgroupId: string | null = null
): Promise<InviteResult> {
  const { adminRow } = await requireAdmin()

  // org_admin can only invite into their own org. super_admin: any org.
  if (adminRow.role === "org_admin" && adminRow.org_id !== orgId) {
    return { created: 0, skipped: 0, errors: ["Cannot invite users to a different org"] }
  }

  const { rows, errors: parseErrors } = parseCsv(csv)
  const errors = [...parseErrors]
  if (rows.length === 0) return { created: 0, skipped: 0, errors }
  if (rows.length > 200) {
    return { created: 0, skipped: 0, errors: ["Cannot invite more than 200 users at once"] }
  }

  const serviceClient = await createServiceClient()

  // Fetch org name for the welcome email
  const { data: orgRow } = await serviceClient
    .from("organisations")
    .select("name")
    .eq("id", orgId)
    .single()
  const orgName = orgRow?.name ?? "your organisation"

  let created = 0
  let skipped = 0

  for (const row of rows) {
    try {
      // Skip if email already exists in auth or profiles.
      const { data: { users: existing } } = await serviceClient.auth.admin.listUsers({ perPage: 1 })
      // listUsers doesn't filter by email — do it via a profile lookup keyed
      // on email is not possible (profiles has no email column). Instead use
      // generateLink which fails idempotently if the user exists.
      void existing  // keep listUsers for future per-page filtering

      const { data: createData, error: createErr } = await serviceClient.auth.admin.createUser({
        email: row.email,
        email_confirm: false,
        user_metadata: { full_name: row.full_name, invited_via_csv: true },
      })

      if (createErr) {
        const msg = createErr.message
        if (/already.+registered|exists/i.test(msg)) {
          skipped++
          continue
        }
        errors.push(`${row.email}: ${msg}`)
        continue
      }

      const newUserId = createData.user?.id
      if (!newUserId) {
        errors.push(`${row.email}: createUser returned no id`)
        continue
      }

      // Create profile row with org pre-assigned, both product toggles false.
      const { error: profileErr } = await serviceClient
        .from("profiles")
        .insert({
          id: newUserId,
          full_name: row.full_name,
          job_title: row.job_title ?? null,
          org_id: orgId,
          subgroup_id: subgroupId,
          account_status: "pending",
          account_type: "standard",
          training_approved: false,
          practitioner_approved: false,
        })
      if (profileErr) {
        errors.push(`${row.email}: profile insert failed: ${profileErr.message}`)
        // Best-effort cleanup: delete the auth user so we don't leave orphans.
        await serviceClient.auth.admin.deleteUser(newUserId).catch(() => {})
        continue
      }

      // Generate a magic link the user clicks to set their password.
      const { data: linkData } = await serviceClient.auth.admin.generateLink({
        type: "invite",
        email: row.email,
      })
      const inviteUrl = linkData?.properties?.action_link ?? `${SITE_URL}/login`

      // Send welcome email via Resend (best-effort — failure here doesn't
      // unwind the user creation since the operator can resend the link
      // from the admin panel manually).
      try {
        await sendEmail({
          from: FROM_ADDRESS,
          to: row.email,
          subject: `You're invited to ${orgName} on Pavitt Public Finance`,
          text: [
            `Hi ${row.full_name},`,
            ``,
            `You've been invited to join ${orgName} on the Pavitt Public Finance training and IPSAS advisor platform.`,
            ``,
            `Click this link to set your password and sign in:`,
            inviteUrl,
            ``,
            `Once you sign in, an admin will activate your training and/or practitioner-advisor access.`,
            ``,
            `If you weren't expecting this email, you can ignore it.`,
            ``,
            `— Pavitt Public Finance`,
          ].join("\n"),
          html: `
            <p>Hi ${escapeHtml(row.full_name)},</p>
            <p>You've been invited to join <strong>${escapeHtml(orgName)}</strong> on the Pavitt Public Finance training and IPSAS advisor platform.</p>
            <p><a href="${inviteUrl}" style="display:inline-block;background:#0ea5e9;color:white;padding:10px 16px;border-radius:6px;text-decoration:none">Set your password &amp; sign in</a></p>
            <p>Or paste this URL: <code>${inviteUrl}</code></p>
            <p>Once you sign in, an admin will activate your training and/or practitioner-advisor access.</p>
            <p style="color:#666;font-size:12px">If you weren't expecting this email, you can ignore it.</p>
          `,
        })
      } catch (emailErr) {
        console.warn("inviteByCsv: welcome email failed", { email: row.email, emailErr })
      }

      created++
    } catch (e) {
      errors.push(`${row.email}: ${(e as Error).message}`)
    }
  }

  return { created, skipped, errors }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!
  ))
}
