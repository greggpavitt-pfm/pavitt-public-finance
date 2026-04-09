// GET  /api/documents — list the current user's uploaded documents
// POST /api/documents — upload a document (multipart/form-data)
//   Fields: file (required), session_id (optional)

import { NextRequest, NextResponse } from "next/server"
import { createAuthedClient, getBearerToken } from "@/lib/supabase"

const BUCKET = "practitioner-documents"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
])

export async function GET(req: NextRequest) {
  const token = getBearerToken(req)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAuthedClient(token)

  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, file_type, file_size, session_id, created_at")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const token = getBearerToken(req)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAuthedClient(token)

  // Verify user identity
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Parse multipart form
  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  const sessionId = formData.get("session_id")

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 })
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 })
  }

  // Validate type
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: PDF, TXT, DOCX" },
      { status: 400 }
    )
  }

  // Store under {userId}/{timestamp}-{filename} to keep users' files isolated
  const storagePath = `${user.id}/${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Save metadata row
  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      session_id: typeof sessionId === "string" ? sessionId : null,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
    })
    .select("id, file_name, file_type, file_size, session_id, created_at")
    .single()

  if (error) {
    // Clean up orphaned storage file
    await supabase.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
