// /training/[moduleId]/flashcards — flashcard study page.
// Fetches flashcards including correct_answer (server-side only via service role).
// Passes data to the FlashcardDeck client component for interactive study + print.

import type { Metadata } from "next"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getFlashcards } from "@/app/training/actions"
import AuthNavbar from "@/components/ui/AuthNavbar"
import Footer from "@/components/ui/Footer"
import FlashcardDeck from "./FlashcardDeck"

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
    title: data ? `${data.title} — Flashcards — IPSAS Training` : "Flashcards — IPSAS Training",
  }
}

interface PageProps {
  params: Promise<{ moduleId: string }>
}

export default async function FlashcardsPage({ params }: PageProps) {
  const { moduleId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: module } = await supabase
    .from("modules")
    .select("id, title, standards")
    .eq("id", moduleId)
    .single()

  if (!module) notFound()

  // correct_answer is fetched server-side via service role — never reaches browser bundle
  const { flashcards, error } = await getFlashcards(moduleId)

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

          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-1 text-2xl font-bold text-ppf-navy">{module.title}</h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-500">Flashcards</p>
              <span className="rounded-full bg-ppf-pale px-2.5 py-0.5 text-xs font-medium text-ppf-sky">
                {flashcards.length} card{flashcards.length !== 1 ? "s" : ""}
              </span>
            </div>

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

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not load flashcards: {error}
            </div>
          ) : (
            <FlashcardDeck flashcards={flashcards} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
