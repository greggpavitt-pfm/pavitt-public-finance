// /admin/results — org admin results report.
//
// Org admins see results for their own organisation's participants only.
// Super admins see the same view but can also access the master report.
//
// Columns: Student | Module | Score | Pass/Fail | Date taken | Attempt
// Features: Print button, Export CSV button

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getOrgResults } from "@/app/admin/actions"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import ExportButton from "./ExportButton"
import PrintButton from "../../training/[moduleId]/results/PrintButton"

export const metadata: Metadata = {
  title: "Results Report — Admin",
}

export default async function AdminResultsPage() {
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

  // Fetch results scoped to this admin's org (or all for super admin calling this page)
  const { rows, error } = await getOrgResults(adminRow.org_id ?? undefined)

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
            href="/admin"
            className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky print:hidden"
          >
            ← Admin dashboard
          </Link>

          {/* Header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-ppf-navy">Results Report</h1>
              <p className="mt-1 text-sm text-slate-500">
                {adminRow.role === "super_admin"
                  ? "All organisations"
                  : "Your organisation's participants"}
                {" "}&mdash; {rows.length} result{rows.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 print:hidden">
              <ExportButton
                rows={rows}
                filename={`ipsas-results-${new Date().toISOString().slice(0, 10)}.csv`}
                includeOrg={adminRow.role === "super_admin"}
              />
              <PrintButton />
              {adminRow.role === "super_admin" && (
                <Link
                  href="/admin/results/master"
                  className="rounded-md bg-ppf-sky px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue"
                >
                  Master report →
                </Link>
              )}
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
              <p className="text-slate-400">No assessment results yet. Results will appear here once participants complete modules.</p>
            </div>
          )}

          {/* Results table */}
          {rows.length > 0 && (
            <div className="rounded-lg border border-ppf-sky/20 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Student</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Module</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">Score</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">Result</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600 print:hidden">Attempt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
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
                        <td className="px-4 py-3 text-center text-slate-400 print:hidden">
                          {row.attempt_number}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Print footer */}
          <div className="hidden print:block mt-8 pt-6 border-t border-slate-300 text-xs text-slate-400 text-center">
            IPSAS Training Platform Results Report &mdash; pfmexpert.net &mdash; {printedAt}
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
