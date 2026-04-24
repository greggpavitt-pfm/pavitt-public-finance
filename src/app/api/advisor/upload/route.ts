// POST /api/advisor/upload
// Handles PDF uploads for the Practitioner Advisor.
//
// Must run in Node.js runtime — pdf-parse requires Node APIs (fs, Buffer, path).
// Cannot run in Edge Runtime.

export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

const MAX_SIZE_BYTES = 4 * 1024 * 1024 // 4 MB — safe below Vercel's 4.5 MB body limit

export async function POST(request: NextRequest) {
  // 1. Verify the user is authenticated
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Parse the multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const conversationId = formData.get('conversationId') as string | null

  // 3. Validate inputs
  if (!file || !conversationId) {
    return NextResponse.json({ error: 'Missing file or conversationId' }, { status: 400 })
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large — maximum 4 MB' }, { status: 400 })
  }

  // 4. Verify the conversation belongs to this user (ownership check via RLS)
  const { data: conversation, error: convError } = await supabase
    .from('advisor_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // 5. Read the file bytes
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 6. Extract text from the PDF.
  // We use require() instead of a top-level import to avoid pdf-parse's
  // internal test-file reads at module init time (which can fail during build).
  // This is safe here because the route explicitly runs on the Node.js runtime.
  let extractedText: string | null = null
  let extractedCharCount: number | null = null
  let status: 'ready' | 'failed' = 'failed'

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>
    const result = await pdfParse(buffer)
    const rawText = result.text?.trim() ?? ''

    if (rawText.length < 50) {
      // Too little text — likely a scanned / image-only PDF
      status = 'failed'
    } else {
      // Store the full character count before truncation so the UI can display it
      extractedCharCount = rawText.length
      // Cap at 50,000 chars (~12,500 tokens) to keep the LLM prompt manageable
      extractedText = rawText.slice(0, 50_000)
      status = 'ready'
    }
  } catch (err) {
    console.error('pdf-parse extraction failed:', err)
    status = 'failed'
  }

  // 7. Upload the raw PDF to Supabase Storage using the service role key.
  // Always forward slashes — never path.join() which uses backslashes on Windows.
  const serviceClient = await createServiceClient()
  const fileUuid = randomUUID()
  const storagePath = `${user.id}/${conversationId}/${fileUuid}.pdf`

  const { error: storageError } = await serviceClient
    .storage
    .from('advisor-documents')
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false })

  if (storageError) {
    console.error('Storage upload failed:', storageError)
    return NextResponse.json({ error: 'File storage failed' }, { status: 500 })
  }

  // 8. Insert a row into advisor_documents (service role bypasses RLS)
  const { data: doc, error: dbError } = await serviceClient
    .from('advisor_documents')
    .insert({
      user_id: user.id,
      conversation_id: conversationId,
      original_filename: file.name,
      file_size_bytes: file.size,
      storage_path: storagePath,
      extracted_text: extractedText,
      extracted_char_count: extractedCharCount,
      status,
    })
    .select('id, status, extracted_char_count')
    .single()

  if (dbError || !doc) {
    console.error('advisor_documents insert failed:', dbError)
    // Clean up the storage file to avoid orphans
    await serviceClient.storage.from('advisor-documents').remove([storagePath])
    return NextResponse.json({ error: 'Database insert failed' }, { status: 500 })
  }

  return NextResponse.json({
    documentId: doc.id,
    status: doc.status,
    extractedCharCount: doc.extracted_char_count,
  })
}
