// /training/review — reviewer dashboard.
// Only accessible to users who are assigned as a reviewer for an org or subgroup.
// Fetches unit results server-side and passes to the ReviewDashboard client component.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AuthNavbar from "@/components/ui/AuthNavbar"
import Footer from "@/components/ui/Footer"
import { getReviewerScope, getUnitResults } from "@/app/training/reviewer-actions"
import ReviewDashboard from "./ReviewDashboard"

export const metadata: Metadata = {
  title: "Group Results — IPSAS Training",
}

export default async function ReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const scope = await getReviewerScope()
  if (!scope) redirect("/training")

  const { students, error } = await getUnitResults(scope)

  const scopeLabel = scope.type === "org" ? "Organisation" : "Subgroup"

  return (
    <>
      <AuthNavbar currentPath="/training" />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-5xl">
          {/* Breadcrumb */}
          <Link
            href="/training"
            className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky"
          >
            ← Back to training
          </Link>

          {/* Header */}
          <div className="mb-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ppf-sky">
              {scopeLabel} Results
            </p>
            <h1 className="text-2xl font-bold text-ppf-navy">{scope.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {students.length} student{students.length !== 1 ? "s" : ""}
            </p>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not load results: {error}
            </div>
          ) : (
            <ReviewDashboard
              students={students}
              scopeType={scope.type}
              scopeName={scope.name}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
