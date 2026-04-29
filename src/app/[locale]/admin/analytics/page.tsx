// /admin/analytics — cohort analytics for org_admin and super_admin.
//
// Shows: active learner count, average score, completion rate, weakest
// modules (by pass rate), and most-active modules.
//
// Scope:
//   org_admin    → only their org_id
//   super_admin  → all orgs (no scope filter)
//
// Practice attempts are excluded from all aggregates so analytics reflect
// real grading outcomes, not learner exploration.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"

export const metadata: Metadata = {
  title: "Cohort analytics — Admin",
}

interface ResultRow {
  module_id: string
  user_id: string
  score: number
  passed: boolean
  submitted_at: string
}

interface ModuleStat {
  module_id: string
  module_title: string
  attempts: number
  passes: number
  avg_score: number
}

export default async function AnalyticsPage() {
  // --- Auth + role check ---
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("role, org_id")
    .eq("id", user.id)
    .single()

  if (!adminRow) redirect("/training")

  const isSuperAdmin = adminRow.role === "super_admin"
  const orgScope = isSuperAdmin ? null : adminRow.org_id

  // --- Fetch data using service client ---
  const serviceClient = await createServiceClient()

  // Build org → user_id list (used to scope assessment_results)
  let userIds: string[] | null = null
  let totalUsers = 0

  if (orgScope) {
    const { data: orgUsers } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("org_id", orgScope)
    userIds = (orgUsers ?? []).map((u) => u.id)
    totalUsers = userIds.length
  } else {
    const { count } = await serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
    totalUsers = count ?? 0
  }

  // Pull all non-practice results (scoped if needed)
  let resultsQuery = serviceClient
    .from("assessment_results")
    .select("module_id, user_id, score, passed, submitted_at")
    .eq("is_practice", false)

  if (userIds) {
    if (userIds.length === 0) {
      // Org has no users yet — short-circuit
      return (
        <EmptyState
          isSuperAdmin={isSuperAdmin}
          totalUsers={0}
          message="No users in this organisation yet."
        />
      )
    }
    resultsQuery = resultsQuery.in("user_id", userIds)
  }

  const { data: results } = await resultsQuery
  const rows: ResultRow[] = (results ?? []) as ResultRow[]

  // Aggregate
  const distinctLearners = new Set(rows.map((r) => r.user_id)).size
  const totalAttempts = rows.length
  const passes = rows.filter((r) => r.passed).length
  const passRate = totalAttempts > 0 ? passes / totalAttempts : 0
  const avgScore =
    totalAttempts > 0
      ? rows.reduce((acc, r) => acc + r.score, 0) / totalAttempts
      : 0

  // Per-module stats
  const byModule = new Map<string, { attempts: number; passes: number; sumScore: number }>()
  for (const r of rows) {
    const e = byModule.get(r.module_id) ?? { attempts: 0, passes: 0, sumScore: 0 }
    e.attempts++
    if (r.passed) e.passes++
    e.sumScore += r.score
    byModule.set(r.module_id, e)
  }

  // Look up module titles
  const moduleIds = Array.from(byModule.keys())
  const { data: modules } = moduleIds.length
    ? await serviceClient
        .from("modules")
        .select("id, title")
        .in("id", moduleIds)
    : { data: [] }

  const titleByModule = new Map<string, string>(
    (modules ?? []).map((m) => [m.id, m.title as string])
  )

  const moduleStats: ModuleStat[] = moduleIds.map((id) => {
    const e = byModule.get(id)!
    return {
      module_id: id,
      module_title: titleByModule.get(id) ?? id,
      attempts: e.attempts,
      passes: e.passes,
      avg_score: e.sumScore / e.attempts,
    }
  })

  // Weakest modules — lowest pass rate, min 3 attempts to avoid noise
  const weakestModules = [...moduleStats]
    .filter((m) => m.attempts >= 3)
    .sort((a, b) => a.passes / a.attempts - b.passes / b.attempts)
    .slice(0, 5)

  // Most-active modules — highest attempt count
  const mostActiveModules = [...moduleStats]
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 5)

  // 30-day rolling activity
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const last30dAttempts = rows.filter(
    (r) => new Date(r.submitted_at).getTime() >= thirtyDaysAgo
  ).length

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <Link
              href="/admin"
              className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-ppf-navy">Cohort analytics</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isSuperAdmin
                ? "All organisations — super admin view"
                : "Your organisation only"}
            </p>
          </div>

          {/* Summary cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Distinct learners" value={distinctLearners.toString()} />
            <Stat label="Total assessments" value={totalAttempts.toString()} />
            <Stat
              label="Average score"
              value={`${avgScore.toFixed(1)}%`}
              tone={avgScore >= 70 ? "good" : avgScore >= 50 ? "warn" : "bad"}
            />
            <Stat
              label="Pass rate"
              value={`${(passRate * 100).toFixed(1)}%`}
              tone={passRate >= 0.7 ? "good" : passRate >= 0.5 ? "warn" : "bad"}
            />
            <Stat
              label="Last 30 days — attempts"
              value={last30dAttempts.toString()}
            />
            <Stat label="Total users in scope" value={totalUsers.toString()} />
            <Stat
              label="Engagement (learners / users)"
              value={
                totalUsers > 0
                  ? `${((distinctLearners / totalUsers) * 100).toFixed(0)}%`
                  : "—"
              }
            />
            <Stat label="Modules attempted" value={moduleStats.length.toString()} />
          </div>

          {/* Weakest modules */}
          <SectionHeading title="Weakest modules" subtitle="Lowest pass rate (min 3 attempts)" />
          <ModuleTable rows={weakestModules} emptyMessage="Not enough data yet — need at least 3 attempts on a module to flag it." />

          {/* Most active */}
          <SectionHeading title="Most-attempted modules" subtitle="Where learners spent the most time" />
          <ModuleTable rows={mostActiveModules} emptyMessage="No assessment activity yet." />
        </div>
      </main>
      <Footer />
    </>
  )
}

function EmptyState({
  isSuperAdmin,
  totalUsers,
  message,
}: {
  isSuperAdmin: boolean
  totalUsers: number
  message: string
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-bold text-ppf-navy">Cohort analytics</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isSuperAdmin ? "Super admin view" : "Your organisation only"}
            &nbsp;·&nbsp;{totalUsers} user{totalUsers === 1 ? "" : "s"} in scope
          </p>
          <div className="mt-10 rounded-lg border border-dashed border-ppf-sky/30 bg-white p-12 text-center text-slate-500">
            {message}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: string
  tone?: "good" | "warn" | "bad" | "neutral"
}) {
  const toneClass: Record<string, string> = {
    good: "text-success-fg",
    warn: "text-amber-600",
    bad: "text-red-600",
    neutral: "text-ppf-navy",
  }
  return (
    <div className="rounded-lg border border-ppf-sky/20 bg-white p-5">
      <p className={`text-2xl font-bold tabular-nums ${toneClass[tone]}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3 mt-10 flex items-baseline justify-between">
      <h2 className="text-lg font-semibold text-ppf-navy">{title}</h2>
      <span className="text-xs text-slate-500">{subtitle}</span>
    </div>
  )
}

function ModuleTable({
  rows,
  emptyMessage,
}: {
  rows: ModuleStat[]
  emptyMessage: string
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-ppf-sky/20 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Module</th>
            <th className="px-4 py-3 text-right">Attempts</th>
            <th className="px-4 py-3 text-right">Passes</th>
            <th className="px-4 py-3 text-right">Pass rate</th>
            <th className="px-4 py-3 text-right">Avg score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const passRate = row.passes / row.attempts
            const passToneClass =
              passRate >= 0.7
                ? "text-success-fg"
                : passRate >= 0.5
                ? "text-amber-600"
                : "text-red-600"
            return (
              <tr key={row.module_id}>
                <td className="px-4 py-3 text-ppf-navy">{row.module_title}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {row.attempts}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {row.passes}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums font-semibold ${passToneClass}`}>
                  {(passRate * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {row.avg_score.toFixed(1)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
