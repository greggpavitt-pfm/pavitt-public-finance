"use client"

// /practitioner/tools/[toolId] — chat interface for a single tool
// Layout: narrow sidebar (sessions) + main chat area (messages + input)

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase"

interface Tool {
  id: string
  name: string
  description: string
  category: string
}

interface Session {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export default function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = use(params)
  const router = useRouter()

  const [tool, setTool] = useState<Tool | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createBrowserClient()

  // ── Init: auth guard + load tool + sessions ──────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace("/practitioner"); return }
      setAccessToken(session.access_token)

      // Load tool metadata
      const { data: toolData } = await supabase
        .from("practitioner_tools")
        .select("id, name, description, category")
        .eq("id", toolId)
        .single()

      if (!toolData) { router.replace("/practitioner/tools"); return }
      setTool(toolData)

      // Load existing sessions, newest first
      const { data: sessionData } = await supabase
        .from("tool_sessions")
        .select("id, title, created_at, updated_at")
        .eq("tool_id", toolId)
        .order("updated_at", { ascending: false })

      setSessions(sessionData ?? [])
    }
    init()
  }, [toolId, router]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load messages when active session changes ─────────────────────────────
  useEffect(() => {
    if (!activeSessionId) { setMessages([]); return }
    setLoadingMessages(true)
    supabase
      .from("tool_messages")
      .select("id, role, content, created_at")
      .eq("session_id", activeSessionId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages((data ?? []) as Message[])
        setLoadingMessages(false)
      })
  }, [activeSessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll to bottom on new messages ────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  // ── Send message ──────────────────────────────────────────────────────────
  async function sendMessage() {
    const content = input.trim()
    if (!content || sending) return
    setInput("")
    setSending(true)
    setError("")

    let sessionId = activeSessionId

    // Create a session on first message
    if (!sessionId) {
      const res = await fetch(`/api/tools/${toolId}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: content.slice(0, 60) }),
      })
      if (!res.ok) { setError("Could not create session."); setSending(false); return }
      const newSession: Session = await res.json()
      sessionId = newSession.id
      setActiveSessionId(sessionId)
      setSessions((prev) => [newSession, ...prev])
    }

    // Optimistically show user message
    const optimisticId = `opt-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: optimisticId, role: "user", content, created_at: new Date().toISOString() },
    ])

    // Call the AI via API route
    const res = await fetch(`/api/tools/${toolId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ session_id: sessionId, content }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? "Something went wrong. Please try again.")
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setSending(false)
      return
    }

    const reply: Message = await res.json()

    // Replace optimistic user message with real messages
    setMessages((prev) => {
      const withoutOptimistic = prev.filter((m) => m.id !== optimisticId)
      return [
        ...withoutOptimistic,
        { id: optimisticId.replace("opt-", "usr-"), role: "user" as const, content, created_at: new Date().toISOString() },
        reply,
      ]
    })

    // Bump session to top of sidebar
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === sessionId ? { ...s, updated_at: new Date().toISOString() } : s
      )
      return updated.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    })

    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function newSession() {
    setActiveSessionId(null)
    setMessages([])
    setSidebarOpen(false)
    inputRef.current?.focus()
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace("/practitioner")
  }

  if (!tool) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* ── Top navigation bar ─────────────────────────────────────────────── */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle sessions"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <Link href="/practitioner/tools" className="text-sm text-slate-400 hover:text-slate-600">
            ← Tools
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-sm font-semibold text-slate-900">{tool.name}</h1>
        </div>
        <button
          onClick={signOut}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          Sign out
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sessions sidebar ───────────────────────────────────────────────── */}
        <aside
          className={`absolute inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-700 bg-slate-900 pt-16 transition-transform lg:relative lg:translate-x-0 lg:pt-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-shrink-0 items-center justify-between px-4 py-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sessions
            </span>
            <button
              onClick={newSession}
              className="rounded-md bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-600"
            >
              + New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {sessions.length === 0 ? (
              <p className="px-2 text-xs text-slate-500">No sessions yet. Send a message to start.</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSessionId(s.id); setSidebarOpen(false) }}
                  className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    activeSessionId === s.id
                      ? "bg-blue-700 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <p className="truncate font-medium">
                    {s.title ?? "Untitled session"}
                  </p>
                  <p className={`mt-0.5 text-xs ${activeSessionId === s.id ? "text-blue-200" : "text-slate-500"}`}>
                    {new Date(s.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-10 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Chat area ──────────────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-2xl space-y-6">
              {!activeSessionId && messages.length === 0 && !sending && (
                <div className="py-12 text-center">
                  <p className="text-lg font-semibold text-slate-700">{tool.name}</p>
                  <p className="mt-2 text-sm text-slate-400">{tool.description}</p>
                  <p className="mt-6 text-sm text-slate-400">
                    Type a message below to begin.
                  </p>
                </div>
              )}

              {loadingMessages && (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-700 text-white"
                        : "border border-slate-200 bg-white text-slate-800 shadow-sm"
                    }`}
                  >
                    {msg.content.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < msg.content.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {/* AI "thinking" indicator */}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-center text-sm text-red-500">{error}</p>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-4">
            <div className="mx-auto flex max-w-2xl items-end gap-3">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                disabled={sending}
                className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                style={{ maxHeight: "160px", overflowY: "auto" }}
                onInput={(e) => {
                  const t = e.currentTarget
                  t.style.height = "auto"
                  t.style.height = `${t.scrollHeight}px`
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white transition-colors hover:bg-blue-800 disabled:opacity-40"
                aria-label="Send message"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-slate-400">
              AI responses are for informational purposes. Always verify against official PFM frameworks.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
