// /admin/usage — practitioner advisor token usage by user.
//
// Shows per-user totals for: today, last 7 days, last 30 days, all-time.
// Scope: org_admin → own org; super_admin → all orgs.
//
// Data source: advisor_usage_log (denormalised per-message log).
// Joins to profiles for full_name + org_id.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"

export const metadata: Metadata = {
  title: "Advisor token usage — Admin",
}

interface UsageRow {
  user_id: string
  total_tokens: number
  created_at: string
}

interface UserUsage {
  user_id: string
  full_name: string
  org_name: string | null
  daily_cap: number
  today: number
  last7d: number
  last30d: number
  all_time: number
}

export default async function UsagePage() {
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

  const serviceClient = await createServiceClient()

  // Resolve scope user list + their caps + org names
  let usersQuery = serviceClient
    .from("profiles")
    .select(
      "id, full_name, daily_token_limit, org_id, organisations(name, default_daily_token_limit)"
    )

  if (orgScope) {
    usersQuery = usersQuery.eq("org_id", orgScope)
  }

  const { data: usersData } = await usersQuery

  // Supabase returns relation as either object or array depending on relationship cardinality.
  // Normalise to a single object (or null) so downstream code is straightforward.
  type OrgRel = { name: string | null; default_daily_token_limit: number | null }
  type RawProfile = {
    id: string
    full_name: string | null
    daily_token_limit: number | null
    org_id: string | null
    organisations: OrgRel | OrgRel[] | null
  }
  type ProfileRow = Omit<RawProfile, "organisations"> & { organisations: OrgRel | null }

  const profiles: ProfileRow[] = ((usersData as RawProfile[] | null) ?? []).map((p) => ({
    ...p,
    organisations: Array.isArray(p.organisations) ? p.organisations[0] ?? null : p.organisations,
  }))

  const userIds = profiles.map((p) => p.id)

  if (userIds.length === 0) {
    return (
      <EmptyState message="No users in scope yet." isSuperAdmin={isSuperAdmin} />
    )
  }

  // Pull all usage logs for these users (cap rows by recency for performance)
  const { data: logsData } = await serviceClient
    .from("advisor_usage_log")
    .select("user_id, total_tokens, created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(20000)

  const logs = (logsData ?? []) as UsageRow[]

  // Aggregate per user
  const now = Date.now()
  const todayBoundary = (() => {
    const d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    return d.getTime()
  })()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

  const buckets = new Map<string, { today: number; last7d: number; last30d: number; all_time: number }>()
  for (const log of logs) {
    const e = buckets.get(log.user_id) ?? { today: 0, last7d: 0, last30d: 0, all_time: 0 }
    const ts = new Date(log.created_at).getTime()
    e.all_time += log.total_tokens
    if (ts >= thirtyDaysAgo) e.last30d += log.total_tokens
    if (ts >= sevenDaysAgo) e.last7d += log.total_tokens
    if (ts >= todayBoundary) e.today += log.total_tokens
    buckets.set(log.user_id, e)
  }

  const rows: UserUsage[] = profiles
    .map((p) => {
      const bucket = buckets.get(p.id) ?? { today: 0, last7d: 0, last30d: 0, all_time: 0 }
      const cap =
        p.daily_token_limit ??
        p.organisations?.default_daily_token_limit ??
        100000
      return {
        user_id: p.id,
        full_name: p.full_name || "(no name)",
        org_name: p.organisations?.name || null,
        daily_cap: cap,
        today: bucket.today,
        last7d: bucket.last7d,
        last30d: bucket.last30d,
        all_time: bucket.all_time,
      }
    })
    .filter((r) => r.all_time > 0 || r.today > 0)
    .sort((a, b) => b.last7d - a.last7d)

  // Totals
  const totalToday = rows.reduce((acc, r) => acc + r.today, 0)
  const total7d = rows.reduce((acc, r) => acc + r.last7d, 0)
  const total30d = rows.reduce((acc, r) => acc + r.last30d, 0)
  const totalAllTime = rows.reduce((acc, r) => acc + r.all_time, 0)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <Link
              href="/admin"
              className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-ppf-navy">Advisor token usage</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isSuperAdmin
                ? "All organisations — super admin view"
                : "Your organisation only"}
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Total label="Today" value={totalToday} />
            <Total label="Last 7 days" value={total7d} />
            <Total label="Last 30 days" value={total30d} />
            <Total label="All time" value={totalAllTime} />
          </div>

          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ppf-sky/30 bg-white p-10 text-center text-slate-500">
              No advisor usage recorded for users in scope.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-ppf-sky/20 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">User</th>
                    {isSuperAdmin && <th className="px-4 py-3">Org</th>}
                    <th className="px-4 py-3 text-right">Today</th>
                    <th className="px-4 py-3 text-right">Daily cap</th>
                    <th className="px-4 py-3 text-right">7 days</th>
                    <th className="px-4 py-3 text-right">30 days</th>
                    <th className="px-4 py-3 text-right">All time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => {
                    const usagePct = r.daily_cap > 0 ? r.today / r.daily_cap : 0
                    const todayClass =
                      usagePct >= 0.9
                        ? "text-red-600 font-semibold"
                        : usagePct >= 0.5
                        ? "text-amber-600 font-semibold"
                        : "text-slate-700"
                    return (
                      <tr key={r.user_id}>
                        <td className="px-4 py-3 font-medium text-ppf-navy">{r.full_name}</td>
                        {isSuperAdmin && (
                          <td className="px-4 py-3 text-slate-600">{r.org_name || "—"}</td>
                        )}
                        <td className={`px-4 py-3 text-right tabular-nums ${todayClass}`}>
                          {r.today.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                          {r.daily_cap.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                          {r.last7d.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                          {r.last30d.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                          {r.all_time.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-400">
            Daily cap resets at midnight UTC. Cap inheritance:
            user limit → org default → 100,000 fallback.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ppf-sky/20 bg-white p-5">
      <p className="text-2xl font-bold tabular-nums text-ppf-navy">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-500">{label} (tokens)</p>
    </div>
  )
}

function EmptyState({ message, isSuperAdmin }: { message: string; isSuperAdmin: boolean }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-ppf-navy">Advisor token usage</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isSuperAdmin ? "Super admin view" : "Your organisation only"}
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
