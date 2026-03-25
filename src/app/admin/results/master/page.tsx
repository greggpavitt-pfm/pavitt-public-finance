// /admin/results/master — super admin master report.
//
// Shows all assessment results across all organisations.
// Access: super_admin only. Org admins are redirected to the scoped report.
//
// Columns: Student | Organisation | Module | Score | Pass/Fail | Date taken
// Features: Print button, Export CSV button, grouped totals by org

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMasterResults } from "@/app/admin/actions"
import type { ResultRow } from "@/app/admin/actions"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import ExportButton from "../ExportButton"
import PrintButton from "../../../training/[moduleId]/results/PrintButton"

export const metadata: Metadata = {
  title: "Master Report — Admin",
}

export default async function MasterReportPage() {
  // --- Auth + role check ---
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!adminRow) redirect("/training")

  // Only super admins can access this page
  if (adminRow.role !== "super_admin") redirect("/admin/results")

  const { rows, error } = await getMasterResults()

  // Group by organisation for summary subtotals
  const orgGroups = new Map<string, { name: string; rows: ResultRow[] }>()
  for (const row of rows) {
    const key = row.org_id ?? "__none__"
    if (!orgGroups.has(key)) {
      orgGroups.set(key, { name: row.org_name ?? "No organisation", rows: [] })
    }
    orgGroups.get(key)!.rows.push(row)
  }

  const printedAt = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16 print:bg-white print:p-8">
        <div className="mx-auto max-w-5xl">

          {/* Breadcrumb */}
          <Link
            href="/admin/results"
            className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky print:hidden"
          >
            ← Results report
          </Link>

          {/* Header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-ppf-navy">Master Report</h1>
              <p className="mt-1 text-sm text-slate-500">
                All organisations &mdash; {rows.length} result{rows.length !== 1 ? "s" : ""} across {orgGroups.size} org{orgGroups.size !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 print:hidden">
              <ExportButton
                rows={rows}
                filename={`ipsas-master-report-${new Date().toISOString().slice(0, 10)}.csv`}
                includeOrg={true}
              />
              <PrintButton />
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
              Could not load results: {error}
            </div>
          )}

          {/* Empty state */}
          {!error && rows.length === 0 && (
            <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center">
              <p className="text-slate-400">No assessment results yet across any organisation.</p>
            </div>
          )}

          {/* Results grouped by organisation */}
          {rows.length > 0 && (
            <div className="flex flex-col gap-8">
              {Array.from(orgGroups.entries()).map(([orgKey, { name, rows: orgRows }]) => {
                const passCount = orgRows.filter((r) => r.passed).length
                const passRate = orgRows.length > 0
                  ? Math.round((passCount / orgRows.length) * 100)
                  : 0

                return (
                  <div key={orgKey} className="rounded-lg border border-ppf-sky/20 bg-white shadow-sm overflow-hidden">
                    {/* Org header with subtotals */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                      <span className="font-semibold text-ppf-navy">{name}</span>
                      <span className="text-sm text-slate-500">
                        {passCount}/{orgRows.length} passed ({passRate}%)
                      </span>
                    </div>

                    {/* Table for this org */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Student</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Module</th>
                            <th className="px-4 py-2.5 text-center font-semibold text-slate-500 text-xs uppercase tracking-wide">Score</th>
                            <th className="px-4 py-2.5 text-center font-semibold text-slate-500 text-xs uppercase tracking-wide">Result</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orgRows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-ppf-navy">{row.full_name}</td>
                              <td className="px-4 py-3 text-slate-600 max-w-xs">
                                <span className="line-clamp-2">{row.module_title}</span>
                              </td>
                              <td className="px-4 py-3 text-center font-semibold">
                                <span className={row.passed ? "text-green-600" : "text-amber-600"}>
                                  {row.score}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  row.passed
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}>
                                  {row.passed ? "Pass" : "Fail"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                {new Date(row.submitted_at).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Print footer */}
          <div className="hidden print:block mt-8 pt-6 border-t border-slate-300 text-xs text-slate-400 text-center">
            IPSAS Training Platform Master Report &mdash; pfmexpert.net &mdash; {printedAt}
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
