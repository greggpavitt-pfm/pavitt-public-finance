// POST /api/tools/[toolId]/messages
// Body: { session_id: string, content: string }
// Saves the user message, calls the AI, saves the assistant reply, returns it.

import { NextRequest, NextResponse } from "next/server"
import { createAuthedClient } from "@/lib/supabase"

function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization")
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null
}
import { chat, AIMessage } from "@/lib/ai"

type Params = Promise<{ toolId: string }>

// Max conversation history to send to the AI (controls token usage)
const MAX_HISTORY = 20

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { toolId } = await params
  const token = getBearerToken(req)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAuthedClient(token)

  // Parse and validate body
  const body = await req.json().catch(() => null)
  const sessionId: string | undefined = body?.session_id
  const content: string | undefined = body?.content?.trim()

  if (!sessionId || !content) {
    return NextResponse.json(
      { error: "session_id and content are required" },
      { status: 400 }
    )
  }

  // Verify the session belongs to this user and this tool (RLS enforces ownership)
  const { data: session, error: sessionError } = await supabase
    .from("tool_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("tool_id", toolId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  // Fetch the tool's system prompt
  const { data: tool } = await supabase
    .from("practitioner_tools")
    .select("system_prompt")
    .eq("id", toolId)
    .single()

  // Load recent conversation history for context
  const { data: history } = await supabase
    .from("tool_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(MAX_HISTORY)

  // Save the user's message now (before AI call, so it's always recorded)
  await supabase.from("tool_messages").insert({
    session_id: sessionId,
    role: "user",
    content,
  })

  // Build message array for the AI
  const messages: AIMessage[] = [
    ...(history ?? []).map((m) => ({
      role: m.role as AIMessage["role"],
      content: m.content,
    })),
    { role: "user" as const, content },
  ]

  // Call AI
  let aiResponse
  try {
    aiResponse = await chat(tool?.system_prompt ?? "", messages)
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI call failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // Save assistant reply
  const { data: saved, error: saveError } = await supabase
    .from("tool_messages")
    .insert({
      session_id: sessionId,
      role: "assistant",
      content: aiResponse.content,
      tokens_used: aiResponse.tokensUsed ?? null,
      model_used: aiResponse.model,
    })
    .select("id, created_at")
    .single()

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 })
  }

  // Touch session updated_at so it sorts to the top of the list
  await supabase
    .from("tool_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId)

  return NextResponse.json({
    id: saved.id,
    role: "assistant",
    content: aiResponse.content,
    model_used: aiResponse.model,
    tokens_used: aiResponse.tokensUsed,
    created_at: saved.created_at,
  })
}
