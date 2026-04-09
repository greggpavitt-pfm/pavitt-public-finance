"use client"

// /practitioner/tools — tools dashboard
// Lists all active practitioner tools. Requires authentication.

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase"

interface Tool {
  id: string
  name: string
  description: string
  category: string
  status: string
}

const CATEGORY_LABELS: Record<string, string> = {
  qa: "Q&A",
  analysis: "Analysis",
  planning: "Planning",
}

const CATEGORY_COLORS: Record<string, string> = {
  qa: "bg-blue-100 text-blue-700",
  analysis: "bg-amber-100 text-amber-700",
  planning: "bg-emerald-100 text-emerald-700",
}

// Simple SVG icons per tool
const TOOL_ICONS: Record<string, React.ReactNode> = {
  "knowledge-assistant": (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  "document-analyzer": (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  "reform-roadmap": (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
    </svg>
  ),
}

export default function ToolsDashboardPage() {
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>([])
  const [userEmail, setUserEmail] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient()

    async function init() {
      // Auth guard
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace("/practitioner"); return }
      setUserEmail(session.user.email ?? "")

      // Load active tools
      const { data } = await supabase
        .from("practitioner_tools")
        .select("id, name, description, category, status")
        .eq("status", "active")
        .order("created_at", { ascending: true })

      setTools(data ?? [])
      setLoading(false)
    }

    init()
  }, [router])

  async function signOut() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.replace("/practitioner")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
              Pavitt Public Finance
            </p>
            <h1 className="text-lg font-bold text-slate-900">Practitioner Toolkit</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:block">{userEmail}</span>
            <button
              onClick={signOut}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Available Tools</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select a tool to start a new session or continue a previous one.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/practitioner/tools/${tool.id}`}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="text-blue-700">
                  {TOOL_ICONS[tool.id] ?? (
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  )}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[tool.category] ?? "bg-slate-100 text-slate-600"}`}>
                  {CATEGORY_LABELS[tool.category] ?? tool.category}
                </span>
              </div>
              <h3 className="mb-2 font-semibold text-slate-900 group-hover:text-blue-700">
                {tool.name}
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-slate-500">
                {tool.description}
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-blue-700">
                Open tool
                <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
