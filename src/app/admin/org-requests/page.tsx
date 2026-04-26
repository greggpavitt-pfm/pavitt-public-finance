// /admin/org-requests — list of demo-trial requests submitted via /request-demo.
// Admin can Approve (spawn org + welcome email) or Reject (mark rejected, no email).
// Pending first, then most recent.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import OrgRequestRow from "./OrgRequestRow"

export const metadata: Metadata = {
  title: "Demo requests — Admin",
}

interface OrgRequest {
  id: string
  created_at: string
  org_name: string
  country: string
  contact_name: string
  contact_email: string
  role: string | null
  expected_users: number | null
  accounting_type: string | null
  status: string
  org_id: string | null
  notes: string | null
  reviewed_at: string | null
}

export default async function OrgRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!adminRow) redirect("/training")

  const serviceClient = await createServiceClient()
  const { data: requests } = await serviceClient
    .from("org_requests")
    .select("*")
    .order("status", { ascending: true })  // pending sorts before approved/rejected alphabetically
    .order("created_at", { ascending: false })
    .limit(200)

  const rows = (requests ?? []) as OrgRequest[]
  const pending = rows.filter((r) => r.status === "pending")
  const reviewed = rows.filter((r) => r.status !== "pending")

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin"
            className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky"
          >
            ← Admin dashboard
          </Link>
          <h1 className="mb-2 text-2xl font-bold text-ppf-navy">Demo requests</h1>
          <p className="mb-8 text-sm text-slate-600">
            Public submissions from <code>/request-demo</code>. Approving creates a 14-day
            trial organisation, an admin profile for the contact, and emails them sign-in
            details.
          </p>

          <Section title={`Pending (${pending.length})`} empty="Nothing in the queue.">
            {pending.map((r) => (
              <OrgRequestRow key={r.id} request={r} />
            ))}
          </Section>

          <div className="mt-12">
            <Section
              title={`Reviewed (last ${Math.min(reviewed.length, 50)})`}
              empty="Nothing reviewed yet."
            >
              {reviewed.slice(0, 50).map((r) => (
                <OrgRequestRow key={r.id} request={r} readOnly />
              ))}
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Section({
  title,
  empty,
  children,
}: {
  title: string
  empty: string
  children: React.ReactNode
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
        {title}
      </h2>
      {hasChildren ? (
        <div className="space-y-3">{children}</div>
      ) : (
        <p className="rounded-md border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          {empty}
        </p>
      )}
    </section>
  )
}
