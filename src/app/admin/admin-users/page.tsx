// /admin/admin-users — grant and revoke admin roles. Super admin only.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import AdminRoleActions from "./AdminRoleActions"
import GrantAdminForm from "./GrantAdminForm"
import { listAdmins } from "@/app/admin/actions"

export const metadata: Metadata = {
  title: "Admin Users — Admin",
}

export default async function AdminUsersPage() {
  // --- Auth + super_admin check ---
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!adminRow || adminRow.role !== "super_admin") redirect("/admin")

  // --- Fetch current admins ---
  const { admins, error } = await listAdmins()

  // --- Fetch approved non-admin users for the grant form ---
  const serviceClient = await createServiceClient()

  const adminIds = new Set(admins.map((a) => a.id))

  const { data: approvedProfiles } = await serviceClient
    .from("profiles")
    .select("id, full_name")
    .eq("account_status", "approved")
    .order("full_name")

  const { data: { users: authUsers } } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
  const emailById = new Map(authUsers.map((u) => [u.id, u.email ?? ""]))

  // Only show users who don't already have an admin role
  const eligibleUsers = (approvedProfiles ?? [])
    .filter((p) => !adminIds.has(p.id))
    .map((p) => ({ id: p.id, full_name: p.full_name, email: emailById.get(p.id) ?? "" }))

  const { data: orgs } = await serviceClient
    .from("organisations")
    .select("id, name")
    .order("name")

  const roleBadge: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700",
    org_admin:   "bg-blue-100 text-blue-700",
  }

  const roleLabel: Record<string, string> = {
    super_admin: "Super admin",
    org_admin:   "Org admin",
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-ppf-navy">Admin Users</h1>
            <p className="mt-1 text-sm text-slate-500">
              Grant or revoke admin access. Super admin only.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load admins: {error}
            </div>
          )}

          {/* Current admins table */}
          <div className="mb-10 overflow-x-auto rounded-lg border border-ppf-sky/20 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No admins found.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-ppf-navy">{admin.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{admin.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadge[admin.role] ?? "bg-slate-100 text-slate-600"}`}>
                          {roleLabel[admin.role] ?? admin.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {admin.org_name ?? (admin.role === "super_admin" ? "All orgs" : "—")}
                      </td>
                      <td className="px-4 py-3">
                        {admin.id !== user.id ? (
                          <AdminRoleActions targetUserId={admin.id} targetName={admin.full_name} />
                        ) : (
                          <span className="text-xs text-slate-400">You</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Grant admin form */}
          <div className="rounded-lg border border-ppf-sky/20 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-ppf-navy">Grant admin access</h2>
            {eligibleUsers.length === 0 ? (
              <p className="text-sm text-slate-500">
                All approved users already have admin access, or there are no approved users yet.
              </p>
            ) : (
              <GrantAdminForm users={eligibleUsers} orgs={orgs ?? []} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
