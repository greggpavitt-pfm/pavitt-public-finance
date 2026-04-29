// /training/topics/[topicCode]/drill — drill session page.
// Fetches questions tagged with this topic (+ pathway filter + optional difficulty).
// Passes them to the client DrillSession component which handles the UI loop.
// No session table is written — this is untracked practice, not graded.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import AuthNavbar from "@/components/ui/AuthNavbar"
import Footer from "@/components/ui/Footer"
import DrillSession from "./DrillSession"

interface PageProps {
  params: Promise<{ topicCode: string }>
  searchParams: Promise<{ difficulty?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topicCode } = await params
  return {
    title: `${topicCode} Drill — IPSAS Training`,
  }
}

export default async function DrillPage({ params, searchParams }: PageProps) {
  const { topicCode } = await params
  const { difficulty } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  // Confirm topic exists
  const serviceClient = await createServiceClient()
  const { data: topic } = await serviceClient
    .from("drill_topics")
    .select("code, name, pathway")
    .eq("code", topicCode.toUpperCase())
    .single()

  if (!topic) notFound()

  // Build question query — no pathway filter; drill topics are cross-pathway.
  // correct_answer is excluded (revoked from authenticated role at DB level).
  let query = serviceClient
    .from("questions")
    .select("id, question_type, question_text, options, explanation, sequence_number, modules!inner(difficulty)")
    .contains("drill_topic_codes", [topic.code])

  const validDifficulties = ["beginner", "intermediate", "advanced"]
  if (difficulty && validDifficulties.includes(difficulty)) {
    query = query.eq("modules.difficulty", difficulty)
  } else if (difficulty === "unlevelled") {
    // Cash-basis modules have no difficulty set
    query = query.is("modules.difficulty", null)
  }

  const { data: rawQuestions } = await query

  // Strip the joined modules field before sending to the client — it's only
  // needed for filtering and should not clutter the client prop.
  const questions = (rawQuestions ?? []).map(({ modules: _m, ...q }) => q)

  return (
    <>
      <AuthNavbar userName={profile.full_name || undefined} currentPath="/training" />
      <main className="min-h-screen bg-ppf-light px-6 py-12 md:px-16">
        <div className="mx-auto max-w-2xl">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/training" className="hover:text-ppf-sky">Training</Link>
            <span>/</span>
            <Link href="/training/topics" className="hover:text-ppf-sky">Topics</Link>
            <span>/</span>
            <Link href={`/training/topics/${topic.code}`} className="hover:text-ppf-sky">{topic.code}</Link>
            <span>/</span>
            <span className="text-slate-600">
              {difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : "All"}
            </span>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center">
              <p className="mb-3 text-slate-500">No questions found for this combination.</p>
              <Link
                href={`/training/topics/${topic.code}`}
                className="text-sm text-ppf-sky hover:underline"
              >
                ← Back to topic
              </Link>
            </div>
          ) : (
            <DrillSession
              topicCode={topic.code}
              topicName={topic.name}
              difficulty={difficulty}
              questions={questions as DrillQuestion[]}
              backHref={`/training/topics/${topic.code}`}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

// Exported so DrillSession can import the type
export interface DrillQuestion {
  id: string
  question_type: "mcq" | "flashcard"
  question_text: string
  options: { id: string; text: string }[] | null
  explanation: string | null
  sequence_number: number
}
