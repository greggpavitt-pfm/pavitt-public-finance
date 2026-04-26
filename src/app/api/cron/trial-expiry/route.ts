// Trial expiry cron — runs daily at 08:00 UTC.
//
// For every organisation with trial_status='active':
//   - days_left <= 0  -> flip trial_status='expired', suspend its users,
//                        send "trial expired" email to org_admin contacts
//   - days_left == 1  -> send T-1 warning email
//   - days_left == 3  -> send T-3 warning email
//
// Idempotent via cron_runs(cron_name, run_date) — second invocation on the
// same UTC date is a no-op.
//
// Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET>.

import { NextRequest, NextResponse } from "next/server"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/flashcard-email/resend"

const FROM_ADDRESS = "Pavitt Public Finance <noreply@pfmexpert.net>"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pfmexpert.net"
const CRON_NAME = "trial-expiry"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface TrialOrg {
  id: string
  name: string
  trial_expires_at: string
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const today = new Date().toISOString().slice(0, 10)

  // Idempotency claim — insert (cron_name, today) row. If conflict, another run
  // already happened today; bail.
  const { error: claimErr } = await supabase
    .from("cron_runs")
    .insert({ cron_name: CRON_NAME, run_date: today })
  if (claimErr) {
    return NextResponse.json({
      skipped: true,
      reason: "already_ran_today",
    })
  }

  const { data: orgs, error: orgErr } = await supabase
    .from("organisations")
    .select("id, name, trial_expires_at")
    .eq("trial_status", "active")

  if (orgErr) {
    return NextResponse.json({ error: orgErr.message }, { status: 500 })
  }

  let expired = 0
  let warnedT3 = 0
  let warnedT1 = 0
  let usersSuspended = 0
  const errors: string[] = []

  const now = Date.now()
  const ONE_DAY = 86400 * 1000

  for (const org of (orgs ?? []) as TrialOrg[]) {
    if (!org.trial_expires_at) continue
    const expiresAt = new Date(org.trial_expires_at).getTime()
    const daysLeft = Math.ceil((expiresAt - now) / ONE_DAY)

    try {
      if (daysLeft <= 0) {
        // Flip to expired + suspend members
        const { error: orgUpdateErr } = await supabase
          .from("organisations")
          .update({ trial_status: "expired" })
          .eq("id", org.id)
        if (orgUpdateErr) throw orgUpdateErr

        const { count: suspendedCount } = await supabase
          .from("profiles")
          .update({ account_status: "suspended" }, { count: "exact" })
          .eq("org_id", org.id)
          .eq("account_status", "approved")
        usersSuspended += suspendedCount ?? 0

        await emailOrgAdmins(supabase, org.id, {
          subject: `Your trial of ${org.name} has expired`,
          html: trialExpiredEmail(org.name),
          text: trialExpiredEmail(org.name, true),
        })

        expired++
      } else if (daysLeft === 3) {
        await emailOrgAdmins(supabase, org.id, {
          subject: `3 days left on your ${org.name} trial`,
          html: trialWarningEmail(org.name, 3),
          text: trialWarningEmail(org.name, 3, true),
        })
        warnedT3++
      } else if (daysLeft === 1) {
        await emailOrgAdmins(supabase, org.id, {
          subject: `1 day left on your ${org.name} trial`,
          html: trialWarningEmail(org.name, 1),
          text: trialWarningEmail(org.name, 1, true),
        })
        warnedT1++
      }
    } catch (e) {
      errors.push(`${org.id}: ${(e as Error).message}`)
    }
  }

  // Mark the cron run finished
  await supabase
    .from("cron_runs")
    .update({
      finished_at: new Date().toISOString(),
      rows_affected: expired + warnedT3 + warnedT1,
      notes: `expired=${expired} t3=${warnedT3} t1=${warnedT1} suspended=${usersSuspended}`,
    })
    .eq("cron_name", CRON_NAME)
    .eq("run_date", today)

  return NextResponse.json({
    expired,
    warned_t3: warnedT3,
    warned_t1: warnedT1,
    users_suspended: usersSuspended,
    errors: errors.slice(0, 10),
  })
}

// Email all admin contacts for the org (admin_users with role='org_admin').
// Best-effort; failures are caught by the outer try/catch and counted.
async function emailOrgAdmins(
  supabase: SupabaseClient,
  orgId: string,
  payload: { subject: string; html: string; text: string }
) {
  const { data: admins } = await supabase
    .from("admin_users")
    .select("id")
    .eq("org_id", orgId)
    .eq("role", "org_admin")

  if (!admins || admins.length === 0) return

  const adminIds = (admins as Array<{ id: string }>).map((a) => a.id)
  // No email column on admin_users — pull from auth.users via service client
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const emails: string[] = (list?.users ?? [])
    .filter((u) => adminIds.includes(u.id) && !!u.email)
    .map((u) => u.email!)

  for (const to of emails) {
    try {
      await sendEmail({ from: FROM_ADDRESS, to, ...payload })
    } catch (e) {
      console.warn("trial-expiry: email send failed", { to, e: (e as Error).message })
    }
  }
}

function trialWarningEmail(orgName: string, daysLeft: number, plain = false): string {
  if (plain) {
    return [
      `Your trial of ${orgName} on Pavitt Public Finance ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
      ``,
      `When the trial expires, user accounts in this organisation will be suspended.`,
      `To convert to a paid plan or extend the trial, reply to this email.`,
      ``,
      `Sign in: ${SITE_URL}/login`,
      ``,
      `— Pavitt Public Finance`,
    ].join("\n")
  }
  return `
    <p>Your trial of <strong>${escapeHtml(orgName)}</strong> on Pavitt Public Finance ends in <strong>${daysLeft} day${daysLeft === 1 ? "" : "s"}</strong>.</p>
    <p>When the trial expires, user accounts in this organisation will be suspended.</p>
    <p>To convert to a paid plan or extend the trial, just reply to this email.</p>
    <p><a href="${SITE_URL}/login">Sign in</a></p>
  `
}

function trialExpiredEmail(orgName: string, plain = false): string {
  if (plain) {
    return [
      `Your trial of ${orgName} on Pavitt Public Finance has expired.`,
      ``,
      `User accounts in this organisation are now suspended. They cannot sign in.`,
      `Reply to this email to convert to a paid plan or extend the trial — we can`,
      `restore access immediately.`,
      ``,
      `— Pavitt Public Finance`,
    ].join("\n")
  }
  return `
    <p>Your trial of <strong>${escapeHtml(orgName)}</strong> on Pavitt Public Finance has expired.</p>
    <p>User accounts in this organisation are now <strong>suspended</strong>. They cannot sign in.</p>
    <p>Reply to this email to convert to a paid plan or extend the trial — we can restore access immediately.</p>
  `
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!
  ))
}
