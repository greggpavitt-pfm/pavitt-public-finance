// /training/[moduleId] — single module view.
// Fetches the module metadata and all questions (WITHOUT correct_answer — that
// column is blocked by RLS for the authenticated role). Renders the interactive
// ModuleViewer client component.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AuthNavbar from "@/components/ui/AuthNavbar"
import Footer from "@/components/ui/Footer"
import ModuleViewer from "./ModuleViewer"

// Next.js calls generateMetadata with the same params as the page
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

  // --- Auth check ---
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // --- Fetch module (RLS ensures approved users only see their pathway's content) ---
  const { data: module } = await supabase
    .from("modules")
    .select("id, title, description, content_md, standards, sequence_number, pathway, difficulty")
    .eq("id", moduleId)
    .single()

  if (!module) notFound()

  // --- Fetch questions (correct_answer is REVOKED — it will not appear in results) ---
  // The question_text for flashcards is the "front"; the correct_answer is the "back"
  // and is only revealed via the checkAnswer() server action.
  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_type, question_text, options, explanation, sequence_number")
    .eq("module_id", moduleId)
    .order("sequence_number", { ascending: true })

  // Check if this module is already complete for this user
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

            {/* Standards tags */}
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
                You&apos;ve completed this module. You can review it again below.
              </span>
            </div>
          )}

          {/* Interactive question viewer */}
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
