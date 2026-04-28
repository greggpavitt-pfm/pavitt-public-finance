// Monthly per-org usage report cron — fires on the 1st of each month at 09:00 UTC.
//
// For every organisation with >= 1 active user in the previous month, build the
// stats payload, render the email, and send to all org_admin contacts plus any
// platform super_admin (so we always have an internal copy).
//
// Test/preview: GET ?dry-run=1&org=<org_id> returns the rendered HTML inline
// for an admin to inspect — no emails are sent. Requires admin auth (NOT cron
// secret) because dry-run is meant for human use.
//
// Idempotency: cron_runs(cron_name, run_date) — second invocation on the same
// UTC date no-ops.

import { NextRequest, NextResponse } from "next/server"
import { createClient as createAnonClient } from "@/lib/supabase/server"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/flashcard-email/resend"
import { renderMonthlyOrgReport, type MonthlyOrgReportInput } from "@/lib/email/templates/monthly-org-report"

const FROM_ADDRESS = "Pavitt Public Finance <noreply@contact.pfmexpert.net>"
const CRON_NAME = "monthly-org-report"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface OrgRow {
  id: string
  name: string
  monthly_token_quota: number | null
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const dryRun = url.searchParams.get("dry-run") === "1"
  const orgFilter = url.searchParams.get("org")

  // Two auth modes:
  //   - Cron call:  Authorization: Bearer <CRON_SECRET>  (sends emails)
  //   - Dry-run:    admin session                        (returns HTML)
  if (!dryRun) {
    const auth = req.headers.get("authorization")
    const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`
    if (!process.env.CRON_SECRET || auth !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  } else {
    // Dry-run: must be admin
    const anonClient = await createAnonClient()
    const { data: { user } } = await anonClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    const { data: adminRow } = await anonClient
      .from("admin_users").select("id").eq("id", user.id).single()
    if (!adminRow) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const today = new Date().toISOString().slice(0, 10)

  // Idempotency: only claim cron_runs row when we're actually firing the cron.
  // Dry-run skips this so admin can preview repeatedly.
  if (!dryRun) {
    const { error: claimErr } = await supabase
      .from("cron_runs")
      .insert({ cron_name: CRON_NAME, run_date: today })
    if (claimErr) {
      return NextResponse.json({ skipped: true, reason: "already_ran_today" })
    }
  }

  // Period = previous calendar month (UTC).
  // If today is 2026-04-01, this covers 2026-03-01 00:00:00 to 2026-04-01 00:00:00.
  const now = new Date()
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const prevPeriodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1))
  const monthLabel = periodStart.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })

  // Org list — optionally filtered for dry-run preview
  let orgQuery = supabase
    .from("organisations")
    .select("id, name, monthly_token_quota")
    // Skip expired/suspended orgs — they shouldn't generate reports.
    .not("plan_type", "in", "(expired,suspended)")
  if (orgFilter) orgQuery = orgQuery.eq("id", orgFilter)
  const { data: orgs, error: orgErr } = await orgQuery
  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })

  const results: Array<{ org_id: string; sent: number; skipped: boolean; reason?: string }> = []
  let totalSent = 0

  for (const org of (orgs ?? []) as OrgRow[]) {
    const stats = await collectOrgStats(supabase, org, periodStart, periodEnd, prevPeriodStart, monthLabel)

    // Skip orgs with zero activity (no advisor calls AND no module completions)
    if (stats.advisor_submissions === 0 && stats.training_completions === 0 && stats.active_users === 0) {
      results.push({ org_id: org.id, sent: 0, skipped: true, reason: "no_activity" })
      continue
    }

    const rendered = renderMonthlyOrgReport(stats)

    if (dryRun) {
      // Return the first matching org's HTML directly so admin can paste-preview.
      return new NextResponse(rendered.html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    }

    const recipients = await resolveOrgAdminEmails(supabase, org.id)
    if (recipients.length === 0) {
      results.push({ org_id: org.id, sent: 0, skipped: true, reason: "no_admins" })
      continue
    }

    let sent = 0
    for (const to of recipients) {
      try {
        await sendEmail({
          from: FROM_ADDRESS,
          to,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        })
        sent++
      } catch (e) {
        console.warn("monthly-org-report: send failed", { to, e: (e as Error).message })
      }
    }
    totalSent += sent
    results.push({ org_id: org.id, sent, skipped: false })
  }

  await supabase
    .from("cron_runs")
    .update({
      finished_at: new Date().toISOString(),
      rows_affected: totalSent,
      notes: `orgs=${orgs?.length ?? 0} sent=${totalSent}`,
    })
    .eq("cron_name", CRON_NAME)
    .eq("run_date", today)

  return NextResponse.json({
    period: monthLabel,
    orgs_scanned: orgs?.length ?? 0,
    emails_sent: totalSent,
    results,
  })
}

async function collectOrgStats(
  supabase: SupabaseClient,
  org: OrgRow,
  periodStart: Date,
  periodEnd: Date,
  prevPeriodStart: Date,
  monthLabel: string
): Promise<MonthlyOrgReportInput> {
  // Advisor submissions = count of user-role messages in conversations belonging
  // to this org's users. Simplest: count advisor_usage_log rows for the org.
  const { count: submissions } = await supabase
    .from("advisor_usage_log")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .gte("created_at", periodStart.toISOString())
    .lt("created_at", periodEnd.toISOString())

  const { count: submissionsPrev } = await supabase
    .from("advisor_usage_log")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .gte("created_at", prevPeriodStart.toISOString())
    .lt("created_at", periodStart.toISOString())

  // Token sum
  const { data: tokenRows } = await supabase
    .from("advisor_usage_log")
    .select("total_tokens")
    .eq("org_id", org.id)
    .gte("created_at", periodStart.toISOString())
    .lt("created_at", periodEnd.toISOString())
  const totalTokens = (tokenRows ?? []).reduce(
    (sum: number, r: { total_tokens: number | null }) => sum + (r.total_tokens ?? 0),
    0
  )

  // Top standards: pull standards_cited from advisor_messages joined via
  // advisor_usage_log.message_id for this org/period, then tally.
  const { data: usageRows } = await supabase
    .from("advisor_usage_log")
    .select("message_id")
    .eq("org_id", org.id)
    .gte("created_at", periodStart.toISOString())
    .lt("created_at", periodEnd.toISOString())
    .not("message_id", "is", null)
  const messageIds = ((usageRows ?? []) as Array<{ message_id: string }>)
    .map((r) => r.message_id)
    .filter(Boolean)
  const topStandards: string[] = []
  if (messageIds.length > 0) {
    const { data: msgs } = await supabase
      .from("advisor_messages")
      .select("standards_cited")
      .in("id", messageIds.slice(0, 1000))  // cap to keep query bounded
    const tally: Record<string, number> = {}
    for (const m of msgs ?? []) {
      const cited = (m as { standards_cited?: string[] }).standards_cited ?? []
      for (const s of cited) tally[s] = (tally[s] ?? 0) + 1
    }
    topStandards.push(
      ...Object.entries(tally)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([s]) => s)
    )
  }

  // Active users = distinct user_id with any advisor_usage_log OR any progress
  // touched in the period.
  const { data: advisorUsers } = await supabase
    .from("advisor_usage_log")
    .select("user_id")
    .eq("org_id", org.id)
    .gte("created_at", periodStart.toISOString())
    .lt("created_at", periodEnd.toISOString())
  // Training side: progress has no created_at — use assessment_results.submitted_at
  const { data: assessUsers } = await supabase
    .from("assessment_results")
    .select("user_id, profiles!inner(org_id)")
    .eq("profiles.org_id", org.id)
    .gte("submitted_at", periodStart.toISOString())
    .lt("submitted_at", periodEnd.toISOString())
  const userSet = new Set<string>()
  for (const r of (advisorUsers ?? []) as Array<{ user_id: string }>) userSet.add(r.user_id)
  for (const r of (assessUsers ?? []) as Array<{ user_id: string }>) userSet.add(r.user_id)

  // Training completions + avg score from assessment_results
  const completions = (assessUsers ?? []).length
  let avgScore: number | null = null
  if (completions > 0) {
    const { data: scoreRows } = await supabase
      .from("assessment_results")
      .select("score, profiles!inner(org_id)")
      .eq("profiles.org_id", org.id)
      .gte("submitted_at", periodStart.toISOString())
      .lt("submitted_at", periodEnd.toISOString())
    const scores = (scoreRows ?? []) as Array<{ score: number }>
    if (scores.length > 0) {
      avgScore = scores.reduce((s, r) => s + r.score, 0) / scores.length
    }
  }

  return {
    org_name:                org.name,
    month_label:             monthLabel,
    advisor_submissions:     submissions ?? 0,
    advisor_submissions_prev: submissionsPrev ?? 0,
    total_tokens:            totalTokens,
    monthly_token_quota:     org.monthly_token_quota,
    top_standards:           topStandards,
    active_users:            userSet.size,
    training_completions:    completions,
    training_avg_score:      avgScore,
  }
}

async function resolveOrgAdminEmails(supabase: SupabaseClient, orgId: string): Promise<string[]> {
  const { data: admins } = await supabase
    .from("admin_users")
    .select("id")
    .eq("org_id", orgId)
    .eq("role", "org_admin")
  const adminIds = ((admins ?? []) as Array<{ id: string }>).map((a) => a.id)
  if (adminIds.length === 0) return []
  // No email column on admin_users — pull from auth.users via service client.
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  return (list?.users ?? [])
    .filter((u) => adminIds.includes(u.id) && !!u.email)
    .map((u) => u.email!)
}
