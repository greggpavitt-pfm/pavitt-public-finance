// /admin/orgs — list all organisations and create new ones.
// Each org shows its name, country, jurisdiction, licence key, status, and user count.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import CreateOrgForm from "./CreateOrgForm"

export const metadata: Metadata = {
  title: "Organisations — Admin",
}

export default async function OrgsPage() {
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

  // Org admin can only see their own org; they also shouldn't be creating new orgs.
  // We still show the page but hide the create form.
  const isSuperAdmin = adminRow.role === "super_admin"

  // --- Fetch orgs (service client to bypass RLS column restriction on licence_key) ---
  const serviceClient = await createServiceClient()

  const { data: orgs, error } = await serviceClient
    .from("organisations")
    .select("id, name, country, jurisdiction_code, licence_key, licence_status, max_users, created_at")
    .order("created_at", { ascending: false })

  // Per-org user counts — fetched as a second query and joined in JS
  // (Supabase doesn't support COUNT in embedded relations without a view)
  const { data: userCounts } = await serviceClient
    .from("profiles")
    .select("org_id")

  // Build a map: org_id → count
  const countMap: Record<string, number> = {}
  if (userCounts) {
    for (const row of userCounts) {
      if (row.org_id) {
        countMap[row.org_id] = (countMap[row.org_id] ?? 0) + 1
      }
    }
  }

  const statusBadge: Record<string, string> = {
    beta:      "bg-blue-100 text-blue-700",
    active:    "bg-green-100 text-green-700",
    expired:   "bg-slate-100 text-slate-500",
    suspended: "bg-red-100 text-red-700",
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-ppf-navy">Organisations</h1>
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load organisations: {error.message}
            </div>
          )}

          {/* Org table */}
          {!orgs || orgs.length === 0 ? (
            <div className="mb-8 rounded-lg border border-ppf-sky/20 bg-white p-10 text-center text-slate-400">
              No organisations yet.
            </div>
          ) : (
            <div className="mb-10 overflow-x-auto rounded-lg border border-ppf-sky/20 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Organisation</th>
                    <th className="px-4 py-3">Licence key</th>
                    <th className="px-4 py-3">Jurisdiction</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Users</th>
                    <th className="px-4 py-3">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-ppf-navy">
                        {org.name}
                        <span className="block text-xs font-normal text-slate-400">
                          {org.country}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {org.licence_key}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {org.jurisdiction_code ?? "Universal"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            statusBadge[org.licence_status] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {org.licence_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {countMap[org.id] ?? 0}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {org.max_users ?? "∞"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Create org form — super admin only */}
          {isSuperAdmin && (
            <div className="rounded-lg border border-ppf-sky/20 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-ppf-navy">Create organisation</h2>
              <CreateOrgForm />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
