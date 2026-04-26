// /admin/users/invite — paste a CSV of users to pre-provision into an org.
// Each invited user receives a Resend welcome email with a magic link to
// set their password. Profiles are created with account_status='pending'
// and both product toggles false — admin activates after sign-in.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import InviteForm from "./InviteForm"

export const metadata: Metadata = {
  title: "Invite users (CSV) — Admin",
}

export default async function InvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("role, org_id")
    .eq("id", user.id)
    .single()
  if (!adminRow) redirect("/training")

  const serviceClient = await createServiceClient()

  // Org list — super_admin gets all; org_admin gets only their org.
  let orgQuery = serviceClient
    .from("organisations")
    .select("id, name")
    .order("name")
  if (adminRow.role === "org_admin" && adminRow.org_id) {
    orgQuery = orgQuery.eq("id", adminRow.org_id)
  }
  const { data: orgs } = await orgQuery

  // Subgroup list keyed by org_id (rendered in the form by client-side filter)
  const { data: subgroups } = await serviceClient
    .from("org_subgroups")
    .select("id, org_id, name")
    .order("name")

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/admin/users"
            className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky"
          >
            ← Users
          </Link>
          <h1 className="mb-6 text-2xl font-bold text-ppf-navy">Invite users (CSV)</h1>

          <div className="mb-6 rounded-md border border-ppf-sky/20 bg-white p-6 text-sm text-slate-700">
            <p className="mb-2 font-semibold text-ppf-navy">CSV format</p>
            <p className="mb-3">
              One row per user. Header row optional. Columns: <code>email</code>,{" "}
              <code>full_name</code>, <code>job_title</code> (optional).
            </p>
            <pre className="rounded bg-slate-50 p-3 text-xs text-slate-600">
{`email,full_name,job_title
alice@mof.gov.sb,Alice Tovua,Senior Accountant
bob@mof.gov.sb,Bob Tonga,Treasury Officer`}
            </pre>
            <p className="mt-3 text-xs text-slate-500">
              Each invited user gets an email with a sign-in link. New profiles start as <strong>pending</strong> with both product toggles off — activate them from the user list after they sign in.
            </p>
          </div>

          <InviteForm orgs={orgs ?? []} subgroups={subgroups ?? []} />
        </div>
      </main>
      <Footer />
    </>
  )
}
