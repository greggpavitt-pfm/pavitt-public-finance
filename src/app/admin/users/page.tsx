// /admin/users — list all users, approve or suspend them, and assign subgroups.
// Supports an optional ?filter=pending query param to show only pending users.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import UserActions from "./UserActions"
import SubgroupAssign from "./SubgroupAssign"
import PathwayEditor from "./PathwayEditor"
import ProductApprovals from "./ProductApprovals"
import UsageLimits from "./UsageLimits"
import BulkApproveBar from "./BulkApproveBar"

export const metadata: Metadata = {
  title: "User Management — Admin",
}

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

  const { filter } = await searchParams

  // --- Fetch users ---
  const serviceClient = await createServiceClient()

  let query = serviceClient
    .from("profiles")
    .select(`
      id,
      full_name,
      job_title,
      org_id,
      subgroup_id,
      pathway,
      ability_level,
      account_status,
      account_type,
      guest_expires_at,
      training_approved,
      practitioner_approved,
      blacklisted,
      training_question_limit,
      practitioner_submission_limit,
      daily_token_limit,
      created_at,
      organisations ( name, default_training_question_limit, default_practitioner_submission_limit ),
      org_subgroups ( name, default_training_question_limit, default_practitioner_submission_limit )
    `)
    .order("created_at", { ascending: false })

  if (adminRow.role === "org_admin" && adminRow.org_id) {
    query = query.eq("org_id", adminRow.org_id)
  }

  if (filter === "pending") {
    query = query.eq("account_status", "pending")
  }

  const { data: profiles, error } = await query

  const { data: { users: authUsers } } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
  const emailByUserId = new Map(authUsers.map((u) => [u.id, u.email ?? ""]))

  const { data: allSubgroups } = await serviceClient
    .from("org_subgroups")
    .select("id, org_id, name")
    .order("name")

  const subgroupsByOrg = new Map<string, { id: string; name: string }[]>()
  for (const sg of allSubgroups ?? []) {
    const existing = subgroupsByOrg.get(sg.org_id) ?? []
    existing.push({ id: sg.id, name: sg.name })
    subgroupsByOrg.set(sg.org_id, existing)
  }

  const statusBadge: Record<string, string> = {
    pending:  "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    suspended: "bg-red-100 text-red-700",
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-7xl">
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

          {!profiles || profiles.length === 0 ? (
            <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center text-slate-400">
              No users found.
            </div>
          ) : (
            <>
            <BulkApproveBar />
            <div className="mb-3 flex justify-end">
              <Link
                href="/admin/users/invite"
                className="rounded-md border border-ppf-sky/30 bg-white px-3 py-1.5 text-xs font-semibold text-ppf-navy hover:bg-ppf-pale"
              >
                + Invite users (CSV)
              </Link>
            </div>
            <div className="overflow-x-auto rounded-lg border border-ppf-sky/20 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-3 w-8"></th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Organisation</th>
                    <th className="px-4 py-3">Pathway</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Approvals</th>
                    <th className="px-4 py-3">Limits</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions / Subgroup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map((profile) => {
                    const orgData = profile.organisations && !Array.isArray(profile.organisations)
                      ? (profile.organisations as {
                          name: string
                          default_training_question_limit: number | null
                          default_practitioner_submission_limit: number | null
                        })
                      : null

                    const subgroupData = profile.org_subgroups && !Array.isArray(profile.org_subgroups)
                      ? (profile.org_subgroups as {
                          name: string
                          default_training_question_limit: number | null
                          default_practitioner_submission_limit: number | null
                        })
                      : null

                    const orgName = orgData?.name ?? "Beta tester"
                    const userEmail = emailByUserId.get(profile.id) ?? "—"

                    const joinedDate = new Date(profile.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })

                    // Placeholder text for usage limit inputs shows the effective inherited default
                    const effectiveTrainingDefault =
                      subgroupData?.default_training_question_limit ??
                      orgData?.default_training_question_limit

                    const effectivePractitionerDefault =
                      subgroupData?.default_practitioner_submission_limit ??
                      orgData?.default_practitioner_submission_limit

                    const trainingPlaceholder = effectiveTrainingDefault != null
                      ? `Default (${effectiveTrainingDefault})`
                      : "Default"

                    const practitionerPlaceholder = effectivePractitionerDefault != null
                      ? `Default (${effectivePractitionerDefault})`
                      : "Default"

                    // No org-level fallback for daily token limit yet — the
                    // platform default (100000) lives in the daily_token_limit
                    // column default. Show that as the placeholder hint.
                    const dailyTokenPlaceholder = "Default (100000)"

                    const orgSubgroups = profile.org_id
                      ? (subgroupsByOrg.get(profile.org_id) ?? [])
                      : []

                    // Guest expiry label (shown in status cell)
                    const guestExpiry = profile.guest_expires_at
                      ? new Date(profile.guest_expires_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })
                      : null

                    const isPending = profile.account_status === "pending" && !profile.blacklisted

                    return (
                      <tr key={profile.id} className="hover:bg-slate-50 align-top">
                        <td className="px-2 py-3">
                          {isPending && (
                            <input
                              type="checkbox"
                              data-bulk-approve-pending="true"
                              data-user-id={profile.id}
                              aria-label={`Select ${profile.full_name} for bulk approve`}
                              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-ppf-sky focus:ring-ppf-sky"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-ppf-navy">
                          {profile.full_name}
                          {profile.job_title && (
                            <span className="block text-xs font-normal text-slate-400">
                              {profile.job_title}
                            </span>
                          )}
                          {profile.account_type === "guest" && (
                            <span className="mt-0.5 block text-xs font-semibold text-amber-600">
                              Guest{guestExpiry ? ` · expires ${guestExpiry}` : ""}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <a
                            href={`mailto:${userEmail}`}
                            className="text-ppf-sky hover:underline"
                          >
                            {userEmail}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{orgName}</td>
                        <td className="px-4 py-3">
                          <PathwayEditor
                            userId={profile.id}
                            currentPathway={profile.pathway ?? null}
                            currentAbility={profile.ability_level ?? null}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              profile.blacklisted
                                ? "bg-red-900 text-white"
                                : (statusBadge[profile.account_status] ?? "bg-slate-100 text-slate-600")
                            }`}
                          >
                            {profile.blacklisted ? "Blacklisted" : profile.account_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ProductApprovals
                            userId={profile.id}
                            trainingApproved={profile.training_approved ?? false}
                            practitionerApproved={profile.practitioner_approved ?? false}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <UsageLimits
                            userId={profile.id}
                            trainingLimit={profile.training_question_limit ?? null}
                            practitionerLimit={profile.practitioner_submission_limit ?? null}
                            dailyTokenLimit={profile.daily_token_limit ?? null}
                            trainingPlaceholder={trainingPlaceholder}
                            practitionerPlaceholder={practitionerPlaceholder}
                            dailyTokenPlaceholder={dailyTokenPlaceholder}
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-500">{joinedDate}</td>
                        <td className="px-4 py-3">
                          <UserActions
                            userId={profile.id}
                            currentStatus={
                              profile.account_status as "pending" | "approved" | "suspended"
                            }
                            accountType={(profile.account_type as "guest" | "standard") ?? "standard"}
                            blacklisted={profile.blacklisted ?? false}
                          />
                          <SubgroupAssign
                            userId={profile.id}
                            currentSubgroupId={profile.subgroup_id ?? null}
                            orgSubgroups={orgSubgroups}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

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
