// /training/[moduleId]/results — shows the outcome of a completed module attempt.
//
// Query param: ?attempt=<assessment_results.id>
//
// Displays:
//   - Module title
//   - Score card (X of Y correct, percentage, pass/fail badge)
//   - Per-question breakdown table (question | your answer | correct answer | result)
//   - Print to PDF button
//   - Back to modules button

import type { Metadata } from "next"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSessionResults } from "@/app/training/actions"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import PrintButton from "./PrintButton"

export const metadata: Metadata = {
  title: "Module Results — IPSAS Training",
}

interface PageProps {
  params: Promise<{ moduleId: string }>
  searchParams: Promise<{ attempt?: string }>
}

export default async function ResultsPage({ params, searchParams }: PageProps) {
  const { moduleId } = await params
  const { attempt: attemptId } = await searchParams

  // --- Auth check ---
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // --- Load result data ---
  if (!attemptId) notFound()

  const { result, error } = await getSessionResults(attemptId)
  if (error || !result) notFound()

  // Sanity check — the result should belong to this module
  if (result.module_id !== moduleId) notFound()

  const total = result.answers.length
  const correctCount = result.answers.filter((a) => a.correct).length
  const submittedDate = new Date(result.submitted_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16 print:bg-white print:p-8">
        <div className="mx-auto max-w-3xl">

          {/* Breadcrumb — hidden when printing */}
          <Link
            href="/training"
            className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky print:hidden"
          >
            ← All modules
          </Link>

          {/* Module title */}
          <h1 className="mb-2 text-2xl font-bold text-ppf-navy">{result.module_title}</h1>
          <p className="mb-8 text-sm text-slate-400">
            Submitted {submittedDate}
          </p>

          {/* ---------------------------------------------------------------- */}
          {/* Score card                                                        */}
          {/* ---------------------------------------------------------------- */}
          <div className={`mb-8 rounded-xl border-2 p-8 text-center shadow-sm ${
            result.passed
              ? "border-green-300 bg-green-50"
              : "border-amber-300 bg-amber-50"
          }`}>
            {/* Pass/fail badge */}
            <span className={`mb-4 inline-block rounded-full px-4 py-1 text-sm font-bold uppercase tracking-wide ${
              result.passed
                ? "bg-green-200 text-green-800"
                : "bg-amber-200 text-amber-800"
            }`}>
              {result.passed ? "Pass" : "Not yet passing"}
            </span>

            {/* Big score number */}
            <div className={`mb-2 text-6xl font-extrabold ${
              result.passed ? "text-green-700" : "text-amber-700"
            }`}>
              {result.score}%
            </div>

            <p className={`text-lg font-medium ${
              result.passed ? "text-green-700" : "text-amber-700"
            }`}>
              {correctCount} of {total} correct
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {result.passed
                ? "Well done — you met the 70% pass threshold."
                : "The pass threshold is 70%. Keep studying and speak to your supervisor."}
            </p>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Action buttons                                                    */}
          {/* ---------------------------------------------------------------- */}
          <div className="mb-8 flex flex-wrap gap-3 print:hidden">
            <PrintButton />
            <Link
              href="/training"
              className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Back to modules
            </Link>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Question breakdown table                                          */}
          {/* ---------------------------------------------------------------- */}
          <div className="rounded-lg border border-ppf-sky/20 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-ppf-navy">Question breakdown</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {result.answers.map((answer, index) => (
                <div key={answer.question_id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    {/* Result icon */}
                    <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      answer.correct
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {answer.correct ? "✓" : "✗"}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Question number and text */}
                      <p className="mb-2 text-sm font-medium text-slate-700">
                        <span className="text-slate-400 mr-1">Q{index + 1}.</span>
                        {answer.question_text}
                      </p>

                      {/* Answer details — only show when incorrect */}
                      {!answer.correct && (
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 text-xs">
                          <div className="rounded bg-red-50 px-3 py-2">
                            <span className="font-semibold text-red-700">Your answer: </span>
                            <span className="text-red-600">
                              {answer.selected === "__self_incorrect__"
                                ? "Marked as not known"
                                : answer.selected}
                            </span>
                          </div>
                          <div className="rounded bg-green-50 px-3 py-2">
                            <span className="font-semibold text-green-700">Correct answer: </span>
                            <span className="text-green-600">{answer.correct_answer}</span>
                          </div>
                        </div>
                      )}

                      {/* Correct answer confirmation */}
                      {answer.correct && (
                        <p className="text-xs text-green-600">
                          {answer.selected === "__self_correct__"
                            ? "Marked as known"
                            : `Answer: ${answer.selected}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Print footer — only visible when printing */}
          <div className="hidden print:block mt-8 pt-6 border-t border-slate-300 text-xs text-slate-400 text-center">
            IPSAS Training Platform &mdash; pfmexpert.net &mdash; {submittedDate}
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
