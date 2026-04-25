// /admin — dashboard landing page.
// Shows a summary of pending users and quick links to the sub-pages.
// Access: admin only. Full role check happens here (middleware only checks login).

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"

export const metadata: Metadata = {
  title: "Admin Dashboard — IPSAS Training",
}

export default async function AdminPage() {
  // --- Auth + role check ---
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Check admin_users via the user's own session (RLS blocks non-admins)
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!adminRow) redirect("/training")

  // --- Fetch summary counts using service client ---
  const serviceClient = await createServiceClient()

  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: orgCount },
  ] = await Promise.all([
    serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_status", "pending"),
    serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_status", "approved"),
    serviceClient
      .from("organisations")
      .select("id", { count: "exact", head: true }),
  ])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-1 text-3xl font-bold text-ppf-navy">Admin Dashboard</h1>
          <p className="mb-10 text-sm text-slate-500">
            {adminRow.role === "super_admin" ? "Super admin" : "Org admin"}
          </p>

          {/* Summary cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Pending approvals"
              value={pendingCount ?? 0}
              urgent={!!(pendingCount && pendingCount > 0)}
              href="/admin/users?filter=pending"
            />
            <StatCard
              label="Active users"
              value={approvedCount ?? 0}
              href="/admin/users"
            />
            <StatCard
              label="Organisations"
              value={orgCount ?? 0}
              href="/admin/orgs"
            />
          </div>

          {/* Navigation cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <NavCard
              title="User management"
              description="Approve or suspend user accounts. View pathway and organisation details."
              href="/admin/users"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              }
            />
            <NavCard
              title="Organisations"
              description="Create organisations and manage their licence keys and jurisdiction codes."
              href="/admin/orgs"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              }
            />
            <NavCard
              title="Advisor token usage"
              description="Per-user advisor token consumption (today, 7-day, 30-day) with cap visibility."
              href="/admin/usage"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
            />
            <NavCard
              title="Cohort analytics"
              description="Active learners, average scores, weakest modules, and engagement trends scoped to your organisation."
              href="/admin/analytics"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
              }
            />
            <NavCard
              title="Results report"
              description="View assessment scores, pass rates, and test dates for your organisation's participants."
              href="/admin/results"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              }
            />
            {adminRow.role === "super_admin" && (
              <NavCard
                title="Master report"
                description="View all assessment activity across every organisation. Super admin only."
                href="/admin/results/master"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                  </svg>
                }
              />
            )}
            {adminRow.role === "super_admin" && (
              <NavCard
                title="Admin users"
                description="Grant or revoke admin access for platform users. Super admin only."
                href="/admin/admin-users"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
                  </svg>
                }
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

// ---------------------------------------------------------------------------
// Small reusable sub-components (private to this file)
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  href,
  urgent = false,
}: {
  label: string
  value: number
  href: string
  urgent?: boolean
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg border p-5 transition-shadow hover:shadow-md ${
        urgent
          ? "border-amber-300 bg-amber-50"
          : "border-ppf-sky/20 bg-white"
      }`}
    >
      <p className={`text-3xl font-bold ${urgent ? "text-amber-600" : "text-ppf-navy"}`}>
        {value}
      </p>
      <p className={`mt-1 text-sm ${urgent ? "text-amber-700" : "text-slate-500"}`}>
        {label}
        {urgent && (
          <span className="ml-2 inline-block rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
            Action needed
          </span>
        )}
      </p>
    </Link>
  )
}

function NavCard({
  title,
  description,
  href,
  icon,
}: {
  title: string
  description: string
  href: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-lg border border-ppf-sky/20 bg-white p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ppf-pale text-ppf-sky">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-ppf-navy">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  )
}
