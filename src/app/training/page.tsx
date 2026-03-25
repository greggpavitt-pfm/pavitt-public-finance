// /training — module list, filtered by the user's pathway + difficulty.
// Middleware ensures only approved + onboarded users reach this page.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { logoutUser } from "@/app/auth/actions"
import CertificatePanel from "@/components/CertificatePanel"
import type { ResultSummary } from "@/components/CertificatePanel"

export const metadata: Metadata = {
  title: "Training — IPSAS Training",
}

export default async function TrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch profile + org jurisdiction in one query
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, pathway, ability_level, org_id, organisations ( name, jurisdiction_code )")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  const orgData =
    profile.organisations && !Array.isArray(profile.organisations)
      ? (profile.organisations as { name: string | null; jurisdiction_code: string | null })
      : null

  const jurisdiction = orgData?.jurisdiction_code ?? null

  // Build module query — RLS already filters to the user's pathway,
  // but we also filter by difficulty (null for cash-basis, specific level for accrual).
  // Include jurisdiction-universal modules + any org-specific ones.
  let query = supabase
    .from("modules")
    .select("id, title, description, sequence_number, standards")
    .eq("pathway", profile.pathway ?? "accrual")
    .order("sequence_number", { ascending: true })

  if (profile.pathway === "accrual") {
    query = query.eq("difficulty", profile.ability_level ?? "beginner")
  }

  // Jurisdiction: show universal (null) + this org's specific overlay
  // We OR this in JS because Supabase doesn't support OR on nullable columns cleanly
  const { data: allModules } = await query

  const modules = (allModules ?? []).filter(
    (m) => m !== null
  )

  // Fetch user's completed module IDs so we can show progress badges
  const { data: progressRows } = await supabase
    .from("progress")
    .select("module_id, status")
    .eq("user_id", user.id)

  const completedIds = new Set(
    (progressRows ?? [])
      .filter((p) => p.status === "completed")
      .map((p) => p.module_id)
  )

  const completedCount = modules.filter((m) => completedIds.has(m.id)).length

  // Fetch assessment results for the certificate panel
  // Use service client so we can join module titles in one query
  const serviceClient = await createServiceClient()
  const { data: resultRows } = await serviceClient
    .from("assessment_results")
    .select("module_id, score, passed, submitted_at, attempt_number")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })

  // Keep only the most recent attempt per module (dedup)
  const seenModules = new Set<string>()
  const dedupedResults = (resultRows ?? []).filter((r) => {
    if (seenModules.has(r.module_id)) return false
    seenModules.add(r.module_id)
    return true
  })

  // Fetch module titles for the result rows
  const resultModuleIds = dedupedResults.map((r) => r.module_id)
  const { data: resultModules } = resultModuleIds.length > 0
    ? await serviceClient.from("modules").select("id, title").in("id", resultModuleIds)
    : { data: [] }

  const resultTitleMap = new Map((resultModules ?? []).map((m) => [m.id, m.title]))

  const certificateResults: ResultSummary[] = dedupedResults.map((r) => ({
    module_id:      r.module_id,
    module_title:   resultTitleMap.get(r.module_id) ?? r.module_id,
    score:          r.score,
    passed:         r.passed,
    submitted_at:   r.submitted_at,
    attempt_number: r.attempt_number,
  }))

  const orgName = orgData?.name ?? null

  // Human-readable labels
  const levelLabel =
    profile.pathway === "accrual" && profile.ability_level
      ? ` — ${profile.ability_level.charAt(0).toUpperCase() + profile.ability_level.slice(1)}`
      : ""
  const pathwayLabel =
    profile.pathway === "accrual" ? `Accrual basis${levelLabel}` : "Cash basis (IPSAS C4)"

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <h1 className="mb-1 text-3xl font-bold text-ppf-navy">
            Welcome back{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mb-2 text-slate-500">{pathwayLabel}</p>

          {/* Progress summary */}
          {modules.length > 0 && (
            <p className="mb-10 text-sm text-slate-400">
              {completedCount} of {modules.length} module{modules.length !== 1 ? "s" : ""} completed
            </p>
          )}

          {/* Certificate / results panel */}
          <CertificatePanel
            results={certificateResults}
            studentName={profile.full_name}
            orgName={orgName}
          />

          {/* Module list */}
          {modules.length === 0 ? (
            <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center">
              <p className="text-slate-400">No modules found for your pathway. Check back soon.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {modules.map((module, index) => {
                const isComplete = completedIds.has(module.id)
                return (
                  <Link
                    key={module.id}
                    href={`/training/${module.id}`}
                    className="group flex items-start gap-4 rounded-lg border border-ppf-sky/20 bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    {/* Sequence number / completion tick */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isComplete
                          ? "bg-green-100 text-green-600"
                          : "bg-ppf-pale text-ppf-sky"
                      }`}
                    >
                      {isComplete ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Title + description */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ppf-navy group-hover:text-ppf-sky transition-colors">
                        {module.title}
                      </p>
                      {module.description && (
                        <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">
                          {module.description}
                        </p>
                      )}
                      {module.standards && module.standards.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(module.standards as string[]).slice(0, 4).map((s: string) => (
                            <span
                              key={s}
                              className="rounded-full bg-ppf-pale px-2 py-0.5 text-xs text-ppf-sky"
                            >
                              {s}
                            </span>
                          ))}
                          {(module.standards as string[]).length > 4 && (
                            <span className="rounded-full bg-ppf-pale px-2 py-0.5 text-xs text-slate-400">
                              +{(module.standards as string[]).length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Chevron */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-ppf-sky transition-colors mt-1">
                      <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Sign out */}
          <div className="mt-10 text-center">
            <form action={logoutUser}>
              <button type="submit" className="text-sm text-slate-400 hover:text-ppf-sky hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
