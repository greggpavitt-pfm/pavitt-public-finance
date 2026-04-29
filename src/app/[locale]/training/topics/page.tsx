// /training/topics — browse all 15 drill topics for the user's pathway.
// Shows question counts per topic so users know which topics have content.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import AuthNavbar from "@/components/ui/AuthNavbar"
import Footer from "@/components/ui/Footer"
import DrillTopicCard from "@/components/DrillTopicCard"

export const metadata: Metadata = {
  title: "Browse by Topic — IPSAS Training",
}

export default async function TopicsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  // Fetch all 15 drill topics
  const serviceClient = await createServiceClient()
  const { data: topics } = await serviceClient
    .from("drill_topics")
    .select("code, name, pathway, standards, sequence_number, description")
    .order("sequence_number", { ascending: true })

  // Fetch question counts per drill topic — no pathway filter.
  // Drill topics are cross-pathway: users see all questions regardless of their basis.
  const { data: questionRows } = await serviceClient
    .from("questions")
    .select("drill_topic_codes")
    .neq("drill_topic_codes", "{}")

  // Build a count map: topicCode → question count
  const countMap: Record<string, number> = {}
  for (const row of questionRows ?? []) {
    const codes = row.drill_topic_codes as string[] | null
    if (!codes) continue
    for (const code of codes) {
      countMap[code] = (countMap[code] ?? 0) + 1
    }
  }

  return (
    <>
      <AuthNavbar userName={profile.full_name || undefined} currentPath="/training" />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-5xl">
          {/* Breadcrumb + heading */}
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/training" className="hover:text-ppf-sky">Training</Link>
            <span>/</span>
            <span className="text-slate-600">Browse by Topic</span>
          </div>

          <h1 className="mb-1 text-3xl font-bold text-ppf-navy">Drill Topics</h1>
          <p className="mb-8 text-slate-500">
            Pick a topic and drill the questions that matter most.
          </p>

          {/* Topic grid — 3 columns on desktop */}
          {(topics ?? []).length === 0 ? (
            <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center text-slate-400">
              No drill topics found. Run seed-drill-topics.ts to populate them.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(topics ?? []).map((topic) => (
                <DrillTopicCard
                  key={topic.code}
                  code={topic.code}
                  name={topic.name}
                  standards={topic.standards as string[] | null}
                  questionCount={countMap[topic.code] ?? 0}
                  href={`/training/topics/${topic.code}`}
                />
              ))}
            </div>
          )}

          {/* Back link */}
          <div className="mt-10 text-center">
            <Link
              href="/training"
              className="text-sm text-slate-400 hover:text-ppf-sky hover:underline"
            >
              ← Back to module view
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
