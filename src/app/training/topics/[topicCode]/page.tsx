// /training/topics/[topicCode] — topic overview with question counts by difficulty.
// User picks a difficulty filter then starts the drill session.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import AuthNavbar from "@/components/ui/AuthNavbar"
import Footer from "@/components/ui/Footer"

interface PageProps {
  params: Promise<{ topicCode: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topicCode } = await params
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from("drill_topics")
    .select("name")
    .eq("code", topicCode)
    .single()

  return {
    title: data ? `${data.name} — IPSAS Drills` : "Drill Topic — IPSAS Training",
  }
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
}

export default async function TopicPage({ params }: PageProps) {
  const { topicCode } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, pathway")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  const userPathway = profile.pathway ?? "accrual"

  // Fetch the topic details
  const serviceClient = await createServiceClient()
  const { data: topic } = await serviceClient
    .from("drill_topics")
    .select("code, name, description, pathway, standards, sequence_number")
    .eq("code", topicCode.toUpperCase())
    .single()

  if (!topic) notFound()

  // Fetch question counts by difficulty — no pathway filter.
  // Drill topics are cross-pathway: all questions shown regardless of user basis.
  const { data: questionRows } = await serviceClient
    .from("questions")
    .select("id, modules!inner(difficulty)")
    .contains("drill_topic_codes", [topic.code])

  const rows = questionRows ?? []
  const totalCount = rows.length

  // Count by difficulty (null difficulty = cash-basis module → own bucket)
  const byCounts: Record<string, number> = { beginner: 0, intermediate: 0, advanced: 0, unlevelled: 0 }
  for (const row of rows) {
    const mod = row.modules as unknown as { difficulty: string | null } | null
    const diff = mod?.difficulty ?? "unlevelled"
    if (diff in byCounts) byCounts[diff]++
  }
  const hasUnlevelled = byCounts["unlevelled"] > 0

  return (
    <>
      <AuthNavbar userName={profile.full_name || undefined} currentPath="/training" />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/training" className="hover:text-ppf-sky">Training</Link>
            <span>/</span>
            <Link href="/training/topics" className="hover:text-ppf-sky">Topics</Link>
            <span>/</span>
            <span className="text-slate-600">{topic.code}</span>
          </div>

          {/* Topic header */}
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-full bg-ppf-pale px-3 py-1 text-sm font-bold text-ppf-sky">
                {topic.code}
              </span>
              <span className="text-xs text-slate-400 capitalize">
                {topic.pathway === "both" ? "Accrual + Cash Basis" : topic.pathway}
              </span>
            </div>
            <h1 className="mb-3 text-2xl font-bold text-ppf-navy leading-snug">
              {topic.name}
            </h1>
            {topic.description && (
              <p className="text-slate-600 leading-relaxed">{topic.description}</p>
            )}
          </div>

          {/* IPSAS standards covered */}
          {topic.standards && (topic.standards as string[]).length > 0 && (
            <div className="mb-8 rounded-lg border border-ppf-sky/20 bg-white p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                IPSAS Standards Covered
              </p>
              <div className="flex flex-wrap gap-2">
                {(topic.standards as string[]).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-ppf-pale px-3 py-1 text-sm font-medium text-ppf-sky"
                  >
                    {s.replace("IPSAS-", "IPSAS ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Question counts + drill buttons */}
          <div className="mb-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Start Drilling
            </p>

            {totalCount === 0 ? (
              <div className="rounded-lg border border-ppf-sky/20 bg-white p-6 text-center">
                <p className="text-slate-400">No questions tagged for this topic yet.</p>
                <p className="mt-1 text-xs text-slate-300">
                  Run tag-questions-with-drill-topics.ts to populate.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* All questions */}
                <Link
                  href={`/training/topics/${topic.code}/drill`}
                  className="flex items-center justify-between rounded-lg border border-ppf-sky bg-ppf-sky/5 px-5 py-4 transition-shadow hover:shadow-md"
                >
                  <div>
                    <p className="font-semibold text-ppf-navy">All Questions</p>
                    <p className="text-sm text-slate-500">{totalCount} questions</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-ppf-sky">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </Link>

                {/* Per difficulty */}
                {(["beginner", "intermediate", "advanced"] as const).map((diff) => {
                  const count = byCounts[diff] ?? 0
                  if (count === 0) return null
                  return (
                    <Link
                      key={diff}
                      href={`/training/topics/${topic.code}/drill?difficulty=${diff}`}
                      className="flex items-center justify-between rounded-lg border border-ppf-sky/20 bg-white px-5 py-4 transition-shadow hover:shadow-md"
                    >
                      <div>
                        <p className="font-semibold text-ppf-navy">{DIFFICULTY_LABELS[diff]}</p>
                        <p className="text-sm text-slate-500">{count} questions</p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-slate-300">
                        <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  )
                })}

                {/* Unlevelled = cash-basis questions (no difficulty set) */}
                {hasUnlevelled && (
                  <Link
                    href={`/training/topics/${topic.code}/drill?difficulty=unlevelled`}
                    className="flex items-center justify-between rounded-lg border border-ppf-sky/20 bg-white px-5 py-4 transition-shadow hover:shadow-md"
                  >
                    <div>
                      <p className="font-semibold text-ppf-navy">Cash Basis (C4)</p>
                      <p className="text-sm text-slate-500">{byCounts["unlevelled"]} questions</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-slate-300">
                      <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Back link */}
          <div className="text-center">
            <Link
              href="/training/topics"
              className="text-sm text-slate-400 hover:text-ppf-sky hover:underline"
            >
              ← All topics
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
