// /training/[moduleId]/test — MCQ-only graded test.
// Fetches module metadata and all questions (without correct_answer — blocked by RLS).
// ModuleViewer self-filters to MCQ type only.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AuthNavbar from "@/components/ui/AuthNavbar"
import Footer from "@/components/ui/Footer"
import ModuleViewer from "../ModuleViewer"

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
    title: data ? `${data.title} — Test — IPSAS Training` : "Test — IPSAS Training",
  }
}

interface PageProps {
  params: Promise<{ moduleId: string }>
}

export default async function TestPage({ params }: PageProps) {
  const { moduleId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: module } = await supabase
    .from("modules")
    .select("id, title, description, standards, pathway, difficulty")
    .eq("id", moduleId)
    .single()

  if (!module) notFound()

  // Fetch questions — correct_answer is REVOKED from authenticated role
  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_type, question_text, options, explanation, sequence_number")
    .eq("module_id", moduleId)
    .order("sequence_number", { ascending: true })

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
            href={`/training/${moduleId}`}
            className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ppf-sky"
          >
            ← Back to module
          </Link>

          {/* Module header */}
          <div className="mb-8">
            <h1 className="mb-1 text-2xl font-bold text-ppf-navy">{module.title}</h1>
            <p className="text-sm text-slate-500">Multiple-choice test</p>

            {module.standards && (module.standards as string[]).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
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

          {isAlreadyComplete && (
            <div className="mb-6 flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-green-600">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                You&apos;ve already completed this module. You can review it again below.
              </span>
            </div>
          )}

          <ModuleViewer
            moduleId={module.id}
            questions={questions ?? []}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
