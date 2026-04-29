// /admin/audit — view the admin_audit_log.
//
// Filters: actor, action, date range. Limit fixed at 200 rows for now.
// org_admin sees everything (RLS scopes to is_admin() — see migration).
// In a multi-org future, scope by org via the target_id join chain.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"

export const metadata: Metadata = {
  title: "Audit log — Admin",
}

interface PageProps {
  searchParams: Promise<{ action?: string; actor?: string; days?: string }>
}

const ROW_LIMIT = 200

export default async function AuditPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!adminRow) redirect("/training")

  const { action, actor, days } = await searchParams
  const daysNum = days ? Math.min(parseInt(days, 10) || 30, 365) : 30

  const serviceClient = await createServiceClient()

  let query = serviceClient
    .from("admin_audit_log")
    .select("id, created_at, actor_id, actor_email, action, target_type, target_id, before, after, metadata")
    .order("created_at", { ascending: false })
    .limit(ROW_LIMIT)

  if (action) query = query.eq("action", action)
  if (actor)  query = query.eq("actor_email", actor)

  // Date filter
  const since = new Date()
  since.setDate(since.getDate() - daysNum)
  query = query.gte("created_at", since.toISOString())

  const { data: rows, error } = await query

  // Distinct actions/actors for filter dropdowns
  const { data: distinctRows } = await serviceClient
    .from("admin_audit_log")
    .select("action, actor_email")
    .order("created_at", { ascending: false })
    .limit(2000)

  const distinctActions = Array.from(new Set((distinctRows ?? []).map((r) => r.action))).sort()
  const distinctActors  = Array.from(new Set((distinctRows ?? []).map((r) => r.actor_email))).sort()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/admin"
            className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky"
          >
            ← Dashboard
          </Link>
          <h1 className="mb-6 text-2xl font-bold text-ppf-navy">Audit log</h1>

          {/* Filter bar — plain GET form, no JS */}
          <form
            method="get"
            className="mb-6 flex flex-wrap items-end gap-3 rounded-md border border-ppf-sky/20 bg-white p-4 text-sm"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Action</span>
              <select
                name="action"
                defaultValue={action ?? ""}
                className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              >
                <option value="">All</option>
                {distinctActions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actor</span>
              <select
                name="actor"
                defaultValue={actor ?? ""}
                className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              >
                <option value="">All</option>
                {distinctActors.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last (days)</span>
              <input
                type="number"
                name="days"
                min={1}
                max={365}
                defaultValue={daysNum}
                className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-ppf-sky px-3 py-1.5 text-sm font-semibold text-white hover:bg-ppf-sky-hover"
            >
              Filter
            </button>
            <Link
              href="/admin/audit"
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Reset
            </Link>
          </form>

          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load audit log: {error.message}
            </div>
          )}

          {!rows || rows.length === 0 ? (
            <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center text-slate-400">
              No audit entries match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-ppf-sky/20 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="align-top hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.actor_email}</td>
                      <td className="px-4 py-3 font-semibold text-ppf-navy">{r.action}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {r.target_type}
                        {r.target_id ? `:${r.target_id.slice(0, 8)}` : ""}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {r.after && (
                          <pre className="max-w-md whitespace-pre-wrap break-all">
                            {JSON.stringify(r.after, null, 0)}
                          </pre>
                        )}
                        {r.metadata && (
                          <pre className="max-w-md whitespace-pre-wrap break-all text-slate-500">
                            {JSON.stringify(r.metadata, null, 0)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-3 text-xs text-slate-500">
                Showing up to {ROW_LIMIT} most-recent entries within the last {daysNum} days.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
