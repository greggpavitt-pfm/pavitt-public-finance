"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function saveFlashcardEmailPrefs(params: {
  enabled: boolean
  hour: number | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }

  if (params.hour !== null && (params.hour < 0 || params.hour > 23)) {
    return { ok: false, error: "Hour must be 0-23" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      daily_flashcard_email: params.enabled,
      daily_flashcard_send_hour_utc: params.hour,
    })
    .eq("id", user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/profile")
  return { ok: true }
}

export async function recordFlashcardGrade(params: {
  question_id: string
  grade: number
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { gradeReview, initialState } = await import("@/lib/flashcard-email/sm2")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }
  if (params.grade < 0 || params.grade > 5) {
    return { ok: false, error: "Grade must be 0-5" }
  }

  const { data: existing } = await supabase
    .from("flashcard_review_state")
    .select("ease_factor, interval_days, repetitions")
    .eq("user_id", user.id)
    .eq("question_id", params.question_id)
    .maybeSingle()

  const current = existing
    ? {
        ease_factor: Number(existing.ease_factor),
        interval_days: existing.interval_days,
        repetitions: existing.repetitions,
      }
    : initialState()

  const next = gradeReview(current, params.grade)
  const dueDate = new Date()
  dueDate.setUTCDate(dueDate.getUTCDate() + next.interval_days)
  const dueDateStr = dueDate.toISOString().slice(0, 10)

  const { error } = await supabase
    .from("flashcard_review_state")
    .upsert({
      user_id: user.id,
      question_id: params.question_id,
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      last_grade: params.grade,
      last_reviewed_at: new Date().toISOString(),
      next_due_date: dueDateStr,
      updated_at: new Date().toISOString(),
    })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
