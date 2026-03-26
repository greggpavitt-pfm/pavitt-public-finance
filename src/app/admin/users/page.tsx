// /admin/users — list all users, approve or suspend them.
// Supports an optional ?filter=pending query param to show only pending users.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import UserActions from "./UserActions"

export const metadata: Metadata = {
  title: "User Management — Admin",
}

// Next.js passes searchParams as a prop to page components
interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function UsersPage({ searchParams }: PageProps) {
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

  // Await searchParams (required in Next.js 15+)
  const { filter } = await searchParams

  // --- Fetch users ---
  const serviceClient = await createServiceClient()

  // Build the query — org_admins only see users from their own org
  let query = serviceClient
    .from("profiles")
    .select(`
      id,
      full_name,
      job_title,
      pathway,
      ability_level,
      account_status,
      created_at,
      organisations ( name )
    `)
    .order("created_at", { ascending: false })

  if (adminRow.role === "org_admin" && adminRow.org_id) {
    query = query.eq("org_id", adminRow.org_id)
  }

  if (filter === "pending") {
    query = query.eq("account_status", "pending")
  }

  const { data: profiles, error } = await query

  // Fetch emails from auth.users so the admin can contact users directly.
  // listUsers is paginated; 1000 covers any reasonable early user base.
  const { data: { users: authUsers } } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
  const emailByUserId = new Map(authUsers.map((u) => [u.id, u.email ?? ""]))

  const statusBadge: Record<string, string> = {
    pending:  "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    suspended: "bg-red-100 text-red-700",
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link
                href="/admin"
                className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky"
              >
                ← Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-ppf-navy">Users</h1>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-2">
              <FilterLink href="/admin/users" active={!filter}>All</FilterLink>
              <FilterLink href="/admin/users?filter=pending" active={filter === "pending"}>
                Pending
              </FilterLink>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load users: {error.message}
            </div>
          )}

          {/* User table */}
          {!profiles || profiles.length === 0 ? (
            <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center text-slate-400">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-ppf-sky/20 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Organisation</th>
                    <th className="px-4 py-3">Pathway</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map((profile) => {
                    // organisations is a joined object (or null for beta testers)
                    const orgName =
                      profile.organisations && !Array.isArray(profile.organisations)
                        ? (profile.organisations as { name: string }).name
                        : "Beta tester"

                    const userEmail = emailByUserId.get(profile.id) ?? "—"

                    const pathwayLabel =
                      profile.pathway === "accrual"
                        ? `Accrual${profile.ability_level ? ` / ${profile.ability_level}` : ""}`
                        : profile.pathway === "cash-basis"
                        ? "Cash basis"
                        : "—"

                    const joinedDate = new Date(profile.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })

                    return (
                      <tr key={profile.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-ppf-navy">
                          {profile.full_name}
                          {profile.job_title && (
                            <span className="block text-xs font-normal text-slate-400">
                              {profile.job_title}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {/* Shown so the admin can send a manual approval email */}
                          <a
                            href={`mailto:${userEmail}`}
                            className="text-ppf-sky hover:underline"
                          >
                            {userEmail}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{orgName}</td>
                        <td className="px-4 py-3 text-slate-600">{pathwayLabel}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              statusBadge[profile.account_status] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {profile.account_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{joinedDate}</td>
                        <td className="px-4 py-3">
                          <UserActions
                            userId={profile.id}
                            currentStatus={
                              profile.account_status as "pending" | "approved" | "suspended"
                            }
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

// Simple link that shows as active/inactive depending on the current filter
function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-ppf-sky text-white"
          : "text-slate-500 hover:bg-ppf-pale hover:text-ppf-navy"
      }`}
    >
      {children}
    </Link>
  )
}
