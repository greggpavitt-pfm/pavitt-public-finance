// /training/[moduleId] — module choice hub.
// Shows two options: Study Flashcards (/flashcards) and Take the Test (/test).
// Each option is only shown if that question type exists in the module.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AuthNavbar from "@/components/ui/AuthNavbar"
import Footer from "@/components/ui/Footer"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleId: string }>
}): Promise<Metadata> {
  const { moduleId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("modules")
    .select("title")
    .eq("id", moduleId)
    .single()

  return {
    title: data ? `${data.title} — IPSAS Training` : "Module — IPSAS Training",
  }
}

interface PageProps {
  params: Promise<{ moduleId: string }>
}

export default async function ModulePage({ params }: PageProps) {
  const { moduleId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: module } = await supabase
    .from("modules")
    .select("id, title, description, standards, sequence_number, pathway, difficulty")
    .eq("id", moduleId)
    .single()

  if (!module) notFound()

  // Count each question type — one lightweight query, no correct_answer needed
  const { data: questionTypes } = await supabase
    .from("questions")
    .select("question_type")
    .eq("module_id", moduleId)

  const mcqCount = (questionTypes ?? []).filter(q => q.question_type === "mcq").length
  const flashcardCount = (questionTypes ?? []).filter(q => q.question_type === "flashcard").length

  const { data: progressRow } = await supabase
    .from("progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .maybeSingle()

  const isAlreadyComplete = progressRow?.status === "completed"

  return (
    <>
      <AuthNavbar currentPath="/training" />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <Link
            href="/training"
            className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky"
          >
            ← All modules
          </Link>

          {/* Module header */}
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-ppf-navy">{module.title}</h1>

            {module.description && (
              <p className="mb-3 text-slate-500">{module.description}</p>
            )}

            {module.standards && (module.standards as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(module.standards as string[]).map((s: string) => (
                  <span
                    key={s}
                    className="rounded-full bg-ppf-pale px-2.5 py-0.5 text-xs font-medium text-ppf-sky"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Already complete banner */}
          {isAlreadyComplete && (
            <div className="mb-6 flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-green-600">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                You&apos;ve completed this module. You can still study the flashcards below.
              </span>
            </div>
          )}

          {/* Option cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Flashcards option */}
            {flashcardCount > 0 && (
              <div className="rounded-lg border border-ppf-sky/20 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-ppf-sky">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <h2 className="font-semibold text-ppf-navy">Study Flashcards</h2>
                </div>
                <p className="mb-4 text-sm text-slate-500">
                  Browse key terms and concepts at your own pace. Print them as cut-out index cards.
                </p>
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-full bg-ppf-pale px-2.5 py-0.5 text-xs font-medium text-ppf-sky">
                    {flashcardCount} card{flashcardCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <Link
                  href={`/training/${moduleId}/flashcards`}
                  className="inline-block rounded-md bg-ppf-sky px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue"
                >
                  Study now →
                </Link>
              </div>
            )}

            {/* Test option */}
            {mcqCount > 0 && (
              <div className="rounded-lg border border-ppf-sky/20 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-ppf-sky">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <h2 className="font-semibold text-ppf-navy">Take the Test</h2>
                </div>
                <p className="mb-4 text-sm text-slate-500">
                  Answer multiple-choice questions and receive a scored result. Pass mark: 70%.
                </p>
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-full bg-ppf-pale px-2.5 py-0.5 text-xs font-medium text-ppf-sky">
                    {mcqCount} question{mcqCount !== 1 ? "s" : ""}
                  </span>
                  {isAlreadyComplete && (
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Completed
                    </span>
                  )}
                </div>
                <Link
                  href={`/training/${moduleId}/test`}
                  className="inline-block rounded-md bg-ppf-sky px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue"
                >
                  Start test →
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
