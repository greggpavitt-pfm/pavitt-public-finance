// Daily flashcard email cron handler.
//
// Triggered by Vercel Cron once per hour. Selects users whose preferred send
// hour matches the current UTC hour (or who have no preference + match the
// default 09:00 UTC slot), picks 3 due flashcards each, sends the email.
//
// Auth: Vercel sets `Authorization: Bearer <CRON_SECRET>` on cron requests.
// We verify against process.env.CRON_SECRET. Any other call is rejected.
//
// Idempotency: flashcard_email_log has UNIQUE(user_id, sent_date), so a
// duplicate run on the same UTC day no-ops the second insert and we skip.
//
// Cost: one Resend API call per opted-in user with due cards. Resend free tier
// is 3000 emails/month — plenty for beta.

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { renderDailyFlashcardEmail, FlashcardForEmail } from "@/lib/flashcard-email/template"
import { sendEmail } from "@/lib/flashcard-email/resend"

const DEFAULT_HOUR_UTC = 9
const CARDS_PER_EMAIL = 3
const FROM_ADDRESS = "Pavitt Public Finance <noreply@contact.pfmexpert.net>"

// Force Node.js runtime — Resend fetch + Supabase service client both fine on edge,
// but we want crypto + larger memory for batch processing.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface CandidateUser {
  id: string
  email: string
  full_name: string | null
  pathway: string | null
}

interface DueCard {
  question_id: string
  question_text: string
  correct_answer: string
  module_title: string
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const auth = req.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const nowUtcHour = new Date().getUTCHours()

  // Find candidate users:
  // - opted in (daily_flashcard_email = true)
  // - approved + training_approved
  // - send_hour matches current hour, OR no preference + we are at default slot
  const { data: users, error: userErr } = await supabase
    .from("profiles")
    .select("id, email, full_name, pathway, daily_flashcard_send_hour_utc, account_status, training_approved")
    .eq("daily_flashcard_email", true)
    .eq("account_status", "approved")
    .eq("training_approved", true)

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 })
  }

  const eligible = (users ?? []).filter((u) => {
    const hour = u.daily_flashcard_send_hour_utc
    if (hour === null || hour === undefined) return nowUtcHour === DEFAULT_HOUR_UTC
    return hour === nowUtcHour
  }) as Array<CandidateUser & { daily_flashcard_send_hour_utc: number | null }>

  let sent = 0
  let skipped = 0
  let failed = 0
  const errors: string[] = []

  for (const user of eligible) {
    if (!user.email) {
      skipped++
      continue
    }

    try {
      const cards = await pickDueCards(supabase, user.id, user.pathway, CARDS_PER_EMAIL)
      if (cards.length === 0) {
        skipped++
        continue
      }

      // Pre-insert log row to claim today's slot (UNIQUE constraint).
      // If insert fails due to conflict, another cron firing already sent today.
      const { error: logErr } = await supabase
        .from("flashcard_email_log")
        .insert({
          user_id: user.id,
          question_ids: cards.map((c) => c.question_id),
          status: "sent",  // optimistic; flip to 'failed' below if Resend errors
        })

      if (logErr) {
        // Most common cause: duplicate (user_id, sent_date) unique violation.
        skipped++
        continue
      }

      const flashcards: FlashcardForEmail[] = cards.map((c) => ({
        question: c.question_text,
        answer: c.correct_answer,
        module_title: c.module_title,
      }))

      const rendered = renderDailyFlashcardEmail({
        user_name: user.full_name,
        cards: flashcards,
        open_url: `https://pfmexpert.net/training`,
      })

      const result = await sendEmail({
        to: user.email,
        from: FROM_ADDRESS,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      })

      // Update log row with provider id
      await supabase
        .from("flashcard_email_log")
        .update({ email_provider_id: result.id })
        .eq("user_id", user.id)
        .eq("sent_date", new Date().toISOString().slice(0, 10))

      sent++
    } catch (e) {
      failed++
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`${user.id}: ${msg}`)

      // Best-effort log update — don't throw if this also fails
      await supabase
        .from("flashcard_email_log")
        .update({ status: "failed", error_message: msg.slice(0, 500) })
        .eq("user_id", user.id)
        .eq("sent_date", new Date().toISOString().slice(0, 10))
        .then(() => undefined, () => undefined)
    }
  }

  return NextResponse.json({
    hour_utc: nowUtcHour,
    candidates: eligible.length,
    sent,
    skipped,
    failed,
    errors: errors.slice(0, 10),
  })
}

// Pick up to N due flashcards for the user.
// Strategy:
//   1. Cards with next_due_date <= today, oldest due first (review_state has rows)
//   2. If fewer than N due, pad with new flashcards from in-progress modules
//      (matching user's pathway) that have no review_state row yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pickDueCards(
  supabase: any,
  userId: string,
  pathway: string | null,
  n: number
): Promise<DueCard[]> {
  const today = new Date().toISOString().slice(0, 10)

  // 1. Existing due cards from review state
  const { data: dueRows } = await supabase
    .from("flashcard_review_state")
    .select("question_id, next_due_date")
    .eq("user_id", userId)
    .lte("next_due_date", today)
    .order("next_due_date", { ascending: true })
    .limit(n)

  const due: DueCard[] = []
  if (dueRows && dueRows.length > 0) {
    const ids = (dueRows as Array<{ question_id: string }>).map((r) => r.question_id)
    const { data: qs } = await supabase
      .from("questions")
      .select("id, question_text, correct_answer, module_id, modules!inner(title)")
      .in("id", ids)
      .eq("question_type", "flashcard")

    for (const q of qs ?? []) {
      const moduleTitleField = (q as { modules?: { title?: string } | Array<{ title?: string }> }).modules
      const moduleTitle = Array.isArray(moduleTitleField)
        ? moduleTitleField[0]?.title ?? "Module"
        : moduleTitleField?.title ?? "Module"
      due.push({
        question_id: q.id as string,
        question_text: q.question_text as string,
        correct_answer: q.correct_answer as string,
        module_title: moduleTitle,
      })
    }
  }

  if (due.length >= n) return due.slice(0, n)

  // 2. Pad with new flashcards from in-progress modules
  const remaining = n - due.length
  const { data: inProgress } = await supabase
    .from("progress")
    .select("module_id")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .limit(20)

  if (!inProgress || inProgress.length === 0) return due

  const moduleIds = (inProgress as Array<{ module_id: string }>).map((r) => r.module_id)
  const seen = new Set(due.map((c) => c.question_id))

  const moduleQuery = supabase
    .from("questions")
    .select("id, question_text, correct_answer, module_id, modules!inner(title, pathway)")
    .in("module_id", moduleIds)
    .eq("question_type", "flashcard")
    .limit(remaining * 4)

  const { data: candidates } = pathway
    ? await moduleQuery.eq("modules.pathway", pathway)
    : await moduleQuery

  for (const q of candidates ?? []) {
    if (due.length >= n) break
    if (seen.has(q.id as string)) continue
    const moduleTitleField = (q as { modules?: { title?: string } | Array<{ title?: string }> }).modules
    const moduleTitle = Array.isArray(moduleTitleField)
      ? moduleTitleField[0]?.title ?? "Module"
      : moduleTitleField?.title ?? "Module"
    due.push({
      question_id: q.id as string,
      question_text: q.question_text as string,
      correct_answer: q.correct_answer as string,
      module_title: moduleTitle,
    })
    seen.add(q.id as string)
  }

  return due
}
