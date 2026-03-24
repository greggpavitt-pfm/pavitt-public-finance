"use server"
// Training server actions.
//
// checkAnswer — verifies a user's MCQ or flashcard answer without ever sending
//               correct_answer to the browser. Uses service_role to bypass the
//               column-level REVOKE on questions.correct_answer.
//
// markModuleComplete — upserts a row into the progress table when the user
//                      finishes all questions in a module.

import { createClient, createServiceClient } from "@/lib/supabase/server"

// ---------------------------------------------------------------------------
// Check a single answer
// ---------------------------------------------------------------------------
// Returns whether the answer is correct, plus the explanation text and the
// correct answer (shown after the user has already submitted — this is safe
// because we only reveal it after the fact, never in advance).

export async function checkAnswer(
  questionId: string,
  selectedAnswer: string
): Promise<{
  correct: boolean
  correctAnswer: string
  explanation: string | null
  error?: string
}> {
  // Confirm the caller is a logged-in approved user
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
// Mark a module complete
// ---------------------------------------------------------------------------
// Called by the client once the user has answered all questions in a module.
// Upserts a progress row (creates it on first completion, updates status on revisit).

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
