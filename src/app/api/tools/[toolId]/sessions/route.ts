// GET  /api/tools/[toolId]/sessions — list the current user's sessions for a tool
// POST /api/tools/[toolId]/sessions — create a new session

import { NextRequest, NextResponse } from "next/server"
import { createAuthedClient } from "@/lib/supabase"

function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization")
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null
}

type Params = Promise<{ toolId: string }>

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { toolId } = await params
  const token = getBearerToken(req)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAuthedClient(token)

  const { data, error } = await supabase
    .from("tool_sessions")
    .select("id, title, metadata, created_at, updated_at")
    .eq("tool_id", toolId)
    .order("updated_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { toolId } = await params
  const token = getBearerToken(req)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAuthedClient(token)

  // Verify user identity
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verify the tool exists and is active
  const { data: tool, error: toolError } = await supabase
    .from("practitioner_tools")
    .select("id")
    .eq("id", toolId)
    .eq("status", "active")
    .single()

  if (toolError || !tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))

  const { data, error } = await supabase
    .from("tool_sessions")
    .insert({
      tool_id: toolId,
      user_id: user.id,
      title: body.title ?? null,
      metadata: body.metadata ?? {},
    })
    .select("id, title, metadata, created_at, updated_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
