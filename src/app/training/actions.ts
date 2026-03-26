"use server"
// Training server actions.
//
// checkAnswer       — verifies a user's MCQ or flashcard answer without ever sending
//                     correct_answer to the browser.
// startSession      — creates (or resumes) a module_sessions row for the current user.
// saveAnswer        — appends one answer to the session's answers JSONB array.
// submitSession     — finalises the session, writes to assessment_results, marks progress complete.
// getSessionResults — returns the assessment_results row for the results page.
// getUserResults    — returns all completed assessment_results for the current user
//                     (used by the certificate panel).

import { createClient, createServiceClient } from "@/lib/supabase/server"

// ---------------------------------------------------------------------------
// Check a single answer
// ---------------------------------------------------------------------------
// Returns whether the answer is correct, plus the explanation and correct answer.
// The correct answer is only returned AFTER the user has already submitted, so
// revealing it here is safe.

export async function checkAnswer(
  questionId: string,
  selectedAnswer: string
): Promise<{
  correct: boolean
  correctAnswer: string
  explanation: string | null
  error?: string
}> {
  // Confirm the caller is a logged-in user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { correct: false, correctAnswer: "", explanation: null, error: "Not authenticated" }

  // Fetch correct_answer using service_role (bypasses the column-level REVOKE)
  const serviceClient = await createServiceClient()
  const { data: question, error } = await serviceClient
    .from("questions")
    .select("correct_answer, explanation")
    .eq("id", questionId)
    .single()

  if (error || !question) {
    console.error("checkAnswer: question not found", { questionId, error })
    return { correct: false, correctAnswer: "", explanation: null, error: "Question not found" }
  }

  const correct = question.correct_answer.trim().toLowerCase() === selectedAnswer.trim().toLowerCase()

  return {
    correct,
    correctAnswer: question.correct_answer,
    explanation: question.explanation ?? null,
  }
}

// ---------------------------------------------------------------------------
// Start (or resume) a session
// ---------------------------------------------------------------------------
// Called when the user opens a module. Creates a new in_progress session, or
// returns the existing one if the user left mid-way through.
// Returns null if the module is already completed (no re-sits allowed).

export async function startSession(
  moduleId: string
): Promise<{
  sessionId: string | null
  alreadyCompleted: boolean
  existingAnswers: Array<{ question_id: string; selected: string; correct: boolean }>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { sessionId: null, alreadyCompleted: false, existingAnswers: [], error: "Not authenticated" }

  // Check if the module is already completed — if so, return early.
  // This is the enforcement gate for the one-attempt-per-module rule.
  // assessment_results.attempt_number is for analytics only; this progress
  // check is the single source of truth for whether re-entry is allowed.
  const { data: progress } = await supabase
    .from("progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .single()

  if (progress?.status === "completed") {
    return { sessionId: null, alreadyCompleted: true, existingAnswers: [] }
  }

  const serviceClient = await createServiceClient()

  // Atomically insert a new session or do nothing if one already exists.
  // This eliminates the race condition where two tabs opening the same module
  // simultaneously could both attempt to insert, causing the second to fail
  // on the unique (user_id, module_id, status) constraint.
  // ignoreDuplicates: true maps to ON CONFLICT DO NOTHING — the existing row
  // is left untouched so we can safely fetch it in the next step.
  const { error: upsertError } = await serviceClient
    .from("module_sessions")
    .upsert(
      {
        user_id:   user.id,
        module_id: moduleId,
        answers:   [],
        status:    "in_progress",
      },
      { onConflict: "user_id,module_id,status", ignoreDuplicates: true }
    )

  if (upsertError) {
    console.error("startSession: upsert failed", { moduleId, userId: user.id, error: upsertError })
    return { sessionId: null, alreadyCompleted: false, existingAnswers: [], error: upsertError.message }
  }

  // Fetch the session — guaranteed to exist now (either just created or already existed)
  const { data: session, error: fetchError } = await serviceClient
    .from("module_sessions")
    .select("id, answers")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .eq("status", "in_progress")
    .single()

  if (fetchError || !session) {
    console.error("startSession: could not fetch session after upsert", { moduleId, userId: user.id, error: fetchError })
    return { sessionId: null, alreadyCompleted: false, existingAnswers: [], error: fetchError?.message ?? "Failed to start session" }
  }

  return { sessionId: session.id, alreadyCompleted: false, existingAnswers: session.answers ?? [] }
}

// ---------------------------------------------------------------------------
// Save an answer to the session
// ---------------------------------------------------------------------------
// Appends one answer object to the session's answers array in the database.
// Called after every question so partial progress is never lost.

export async function saveAnswer(
  sessionId: string,
  questionId: string,
  selected: string,
  correct: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const serviceClient = await createServiceClient()

  // Append the new answer to the JSONB array using Postgres's jsonb_insert equivalent.
  // Supabase doesn't support array append directly, so we fetch + update.
  const { data: session, error: fetchError } = await serviceClient
    .from("module_sessions")
    .select("answers")
    .eq("id", sessionId)
    .eq("user_id", user.id)  // Ownership check
    .single()

  if (fetchError || !session) {
    console.error("saveAnswer: session not found", { sessionId, userId: user.id, error: fetchError })
    return { error: "Session not found" }
  }

  const updatedAnswers = [
    ...(session.answers ?? []),
    { question_id: questionId, selected, correct },
  ]

  const { error } = await serviceClient
    .from("module_sessions")
    .update({ answers: updatedAnswers })
    .eq("id", sessionId)

  if (error) {
    console.error("saveAnswer: update failed", { sessionId, error })
    return { error: error.message }
  }
  return {}
}

// ---------------------------------------------------------------------------
// Submit a session
// ---------------------------------------------------------------------------
// Finalises the session: calculates score, writes to assessment_results,
// marks progress as completed, and marks the session as submitted.
// Returns the assessment result ID so the caller can redirect to the results page.

export async function submitSession(
  sessionId: string
): Promise<{
  attemptId: string | null
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { attemptId: null, error: "Not authenticated" }

  const serviceClient = await createServiceClient()

  // Fetch the session
  const { data: session, error: fetchError } = await serviceClient
    .from("module_sessions")
    .select("id, module_id, answers, status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !session) {
    console.error("submitSession: session not found", { sessionId, userId: user.id, error: fetchError })
    return { attemptId: null, error: "Session not found" }
  }
  if (session.status === "submitted") {
    console.error("submitSession: session already submitted", { sessionId })
    return { attemptId: null, error: "Session already submitted" }
  }

  const answers: Array<{ question_id: string; selected: string; correct: boolean }> = session.answers ?? []
  const total = answers.length
  const correctCount = answers.filter((a) => a.correct).length

  // Score as a percentage (0-100), rounded to nearest integer
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const passed = score >= 70

  // Determine the attempt number (how many times this user has tried this module)
  const { count } = await serviceClient
    .from("assessment_results")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("module_id", session.module_id)

  const attemptNumber = (count ?? 0) + 1

  // Write the assessment result
  const { data: result, error: resultError } = await serviceClient
    .from("assessment_results")
    .insert({
      user_id:        user.id,
      module_id:      session.module_id,
      attempt_number: attemptNumber,
      score,
      answers,
      passed,
      submitted_at:   new Date().toISOString(),
    })
    .select("id")
    .single()

  if (resultError || !result) {
    console.error("submitSession: failed to write assessment_results", { sessionId, moduleId: session.module_id, error: resultError })
    return { attemptId: null, error: resultError?.message ?? "Failed to save results" }
  }

  // Mark progress as completed
  await serviceClient
    .from("progress")
    .upsert(
      {
        user_id:      user.id,
        module_id:    session.module_id,
        status:       "completed",
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" }
    )

  // Mark the session as submitted
  await serviceClient
    .from("module_sessions")
    .update({
      status:       "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", sessionId)

  return { attemptId: result.id }
}

// ---------------------------------------------------------------------------
// Get session results (for the results page)
// ---------------------------------------------------------------------------
// Fetches the assessment_results row plus module title for display.

export async function getSessionResults(attemptId: string): Promise<{
  result: {
    id: string
    module_id: string
    module_title: string
    attempt_number: number
    score: number
    passed: boolean
    submitted_at: string
    answers: Array<{
      question_id: string
      selected: string
      correct: boolean
      question_text?: string
      correct_answer?: string
    }>
  } | null
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { result: null, error: "Not authenticated" }

  const serviceClient = await createServiceClient()

  // Fetch the result row (service role so we can join correct_answer from questions)
  const { data: row, error } = await serviceClient
    .from("assessment_results")
    .select("id, module_id, attempt_number, score, passed, submitted_at, answers")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single()

  if (error || !row) {
    console.error("getSessionResults: result not found", { attemptId, userId: user.id, error })
    return { result: null, error: "Result not found" }
  }

  // Fetch module title
  const { data: module } = await serviceClient
    .from("modules")
    .select("title")
    .eq("id", row.module_id)
    .single()

  // Enrich answers with question text and correct answer for the breakdown table
  const answers: Array<{ question_id: string; selected: string; correct: boolean }> = row.answers ?? []
  const questionIds = answers.map((a) => a.question_id)

  const { data: questions } = await serviceClient
    .from("questions")
    .select("id, question_text, correct_answer")
    .in("id", questionIds)

  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]))

  const enrichedAnswers = answers.map((a) => {
    const q = questionMap.get(a.question_id)
    return {
      ...a,
      question_text:  q?.question_text ?? "",
      correct_answer: q?.correct_answer ?? "",
    }
  })

  return {
    result: {
      id:             row.id,
      module_id:      row.module_id,
      module_title:   module?.title ?? row.module_id,
      attempt_number: row.attempt_number,
      score:          row.score,
      passed:         row.passed,
      submitted_at:   row.submitted_at,
      answers:        enrichedAnswers,
    },
  }
}

// ---------------------------------------------------------------------------
// Get all results for the current user (for the certificate panel)
// ---------------------------------------------------------------------------
// Returns a summary of every completed module attempt — the most recent attempt
// per module is shown.

export async function getUserResults(): Promise<{
  results: Array<{
    module_id: string
    module_title: string
    score: number
    passed: boolean
    submitted_at: string
    attempt_number: number
  }>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { results: [], error: "Not authenticated" }

  const serviceClient = await createServiceClient()

  // Fetch all attempts, ordered newest-first
  const { data: rows, error } = await serviceClient
    .from("assessment_results")
    .select("module_id, score, passed, submitted_at, attempt_number")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })

  if (error) {
    console.error("getUserResults: fetch failed", { userId: user.id, error })
    return { results: [], error: error.message }
  }

  // Keep only the most recent attempt per module
  const seen = new Set<string>()
  const deduped = (rows ?? []).filter((r) => {
    if (seen.has(r.module_id)) return false
    seen.add(r.module_id)
    return true
  })

  // Fetch titles for all modules in one query
  const moduleIds = deduped.map((r) => r.module_id)
  const { data: modules } = await serviceClient
    .from("modules")
    .select("id, title")
    .in("id", moduleIds)

  const titleMap = new Map((modules ?? []).map((m) => [m.id, m.title]))

  const results = deduped.map((r) => ({
    module_id:      r.module_id,
    module_title:   titleMap.get(r.module_id) ?? r.module_id,
    score:          r.score,
    passed:         r.passed,
    submitted_at:   r.submitted_at,
    attempt_number: r.attempt_number,
  }))

  return { results }
}

// ---------------------------------------------------------------------------
// Auto-submit stale sessions
// ---------------------------------------------------------------------------
// Finds any in_progress sessions for the current user that are older than
// 24 hours and submits them automatically. Called from the training page on
// each load so abandoned sessions are never left dangling indefinitely.
// This fulfils the promise in the module_sessions schema comment.

export async function autoSubmitStaleSessions(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const serviceClient = await createServiceClient()

  // Find sessions started more than 24 hours ago that are still in_progress
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: staleSessions, error: fetchError } = await serviceClient
    .from("module_sessions")
    .select("id, module_id, answers")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .lt("started_at", cutoff)

  if (fetchError) {
    console.error("autoSubmitStaleSessions: fetch failed", { userId: user.id, error: fetchError })
    return
  }

  if (!staleSessions || staleSessions.length === 0) return

  for (const session of staleSessions) {
    const answers: Array<{ question_id: string; selected: string; correct: boolean }> = session.answers ?? []
    const total        = answers.length
    const correctCount = answers.filter((a) => a.correct).length
    const score        = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const passed       = score >= 70

    // Determine attempt number for this module
    const { count } = await serviceClient
      .from("assessment_results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("module_id", session.module_id)

    const attemptNumber = (count ?? 0) + 1

    // Write the assessment result
    const { error: resultError } = await serviceClient
      .from("assessment_results")
      .insert({
        user_id:        user.id,
        module_id:      session.module_id,
        attempt_number: attemptNumber,
        score,
        answers,
        passed,
        submitted_at:   new Date().toISOString(),
      })

    if (resultError) {
      console.error("autoSubmitStaleSessions: failed to write result", { sessionId: session.id, error: resultError })
      continue  // Skip remaining steps for this session; leave it in_progress so it can be retried next load
    }

    // Mark progress as completed
    await serviceClient
      .from("progress")
      .upsert(
        {
          user_id:      user.id,
          module_id:    session.module_id,
          status:       "completed",
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,module_id" }
      )

    // Mark the session as submitted
    await serviceClient
      .from("module_sessions")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", session.id)

    console.log("autoSubmitStaleSessions: auto-submitted session", session.id, "for module", session.module_id)
  }
}

// ---------------------------------------------------------------------------
// Mark a module complete (legacy — kept for compatibility)
// ---------------------------------------------------------------------------
// New code should call submitSession() instead. This is retained so that any
// existing code paths don't break during the transition.

export async function markModuleComplete(moduleId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("progress")
    .upsert(
      {
        user_id:      user.id,
        module_id:    moduleId,
        status:       "completed",
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" }
    )

  if (error) return { error: error.message }
  return {}
}
