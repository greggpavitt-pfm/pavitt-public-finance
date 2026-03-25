"use client"
// ModuleViewer — handles the interactive flashcard + MCQ experience.
//
// Session flow (new):
//   1. On mount, calls startSession() to create or resume a server-side session.
//      If the module is already completed, a read-only view is shown instead.
//   2. Each answer is saved server-side via saveAnswer() immediately after
//      the user submits. This means partial progress survives a page refresh.
//   3. When all questions are answered, submitSession() is called. It calculates
//      the final score, writes to assessment_results, marks progress complete,
//      and returns an attemptId.
//   4. The component redirects to /training/[moduleId]/results?attempt=[attemptId].
//
// Correct answers are never in the initial page HTML — they are only
// returned by checkAnswer() after the user has already submitted.

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  checkAnswer,
  startSession,
  saveAnswer,
  submitSession,
} from "@/app/training/actions"

// The shape of each question row (correct_answer excluded — blocked by RLS)
interface Question {
  id: string
  question_type: "mcq" | "flashcard"
  question_text: string
  options: { id: string; text: string }[] | null
  explanation: string | null
  sequence_number: number
}

interface Props {
  moduleId: string
  questions: Question[]
}

// What we know about a question once the user has answered it
interface AnswerResult {
  correct: boolean
  correctAnswer: string
  explanation: string | null
}

export default function ModuleViewer({ moduleId, questions }: Props) {
  const router = useRouter()

  // Session state — set after startSession() resolves on mount
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  // Index of the current question being shown
  const [currentIndex, setCurrentIndex] = useState(0)

  // Map of questionId → result (populated when the user answers)
  const [results, setResults] = useState<Record<string, AnswerResult>>({})

  // For flashcards: whether the answer has been revealed
  const [revealed, setRevealed] = useState(false)

  // For MCQs: which option the user has clicked (before server round-trip)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  // Whether the module submission action is running
  const [isSubmitting, startSubmitting] = useTransition()
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  // General pending state for checkAnswer calls
  const [isChecking, startChecking] = useTransition()

  // -------------------------------------------------------------------------
  // Start or resume the session on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    async function init() {
      const response = await startSession(moduleId)
      if (cancelled) return

      if (response.error) {
        setSessionError(response.error)
        setSessionLoading(false)
        return
      }

      if (response.alreadyCompleted) {
        setAlreadyCompleted(true)
        setSessionLoading(false)
        return
      }

      setSessionId(response.sessionId)

      // Restore any previously-saved answers so the user resumes where they left off
      if (response.existingAnswers.length > 0) {
        const restored: Record<string, AnswerResult> = {}
        for (const a of response.existingAnswers) {
          // We don't have the correctAnswer text here — user already saw it.
          // We mark it as answered so the UI moves past it.
          restored[a.question_id] = {
            correct: a.correct,
            correctAnswer: "",   // Not needed for already-answered questions
            explanation: null,
          }
        }
        setResults(restored)

        // Advance index to the first unanswered question
        const answeredIds = new Set(response.existingAnswers.map((a) => a.question_id))
        const firstUnansweredIndex = questions.findIndex((q) => !answeredIds.has(q.id))
        if (firstUnansweredIndex !== -1) {
          setCurrentIndex(firstUnansweredIndex)
        }
      }

      setSessionLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [moduleId]) // questions is stable (server-rendered), moduleId won't change

  // -------------------------------------------------------------------------
  // Loading / error / already-completed states
  // -------------------------------------------------------------------------
  if (sessionLoading) {
    return (
      <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center text-slate-400">
        Loading session…
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-10 text-center text-red-700">
        Could not start session: {sessionError}
      </div>
    )
  }

  if (alreadyCompleted) {
    return (
      <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center">
        <p className="mb-4 text-slate-600">
          You have already completed this module. Modules can only be attempted once.
        </p>
        <a
          href="/training"
          className="inline-block rounded-md bg-ppf-sky px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue"
        >
          Back to modules
        </a>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center text-slate-400">
        No questions found for this module.
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const currentResult = results[currentQuestion.id]
  const isAnswered = !!currentResult

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  // MCQ: called when the user clicks an option
  function handleMCQSelect(optionId: string) {
    if (isAnswered || isChecking) return
    setSelectedOption(optionId)
    startChecking(async () => {
      const result = await checkAnswer(currentQuestion.id, optionId)
      const answerResult: AnswerResult = {
        correct: result.correct,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
      }
      setResults((prev) => ({ ...prev, [currentQuestion.id]: answerResult }))

      // Persist to server session (fire-and-forget — non-blocking)
      if (sessionId) {
        await saveAnswer(sessionId, currentQuestion.id, optionId, result.correct)
      }
    })
  }

  // Flashcard: called when user marks correct/incorrect after revealing
  function handleFlashcardResult(correct: boolean) {
    startChecking(async () => {
      // Fetch the correct answer from the server so we can display it
      const result = await checkAnswer(
        currentQuestion.id,
        correct ? "__self_correct__" : "__self_incorrect__"
      )
      const answerResult: AnswerResult = {
        correct,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
      }
      setResults((prev) => ({ ...prev, [currentQuestion.id]: answerResult }))

      // Persist to server session
      if (sessionId) {
        await saveAnswer(
          sessionId,
          currentQuestion.id,
          correct ? "__self_correct__" : "__self_incorrect__",
          correct
        )
      }
    })
  }

  // Advance to the next question or submit the whole session
  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setRevealed(false)
      setSelectedOption(null)
    } else {
      // Last question — submit the session and redirect to results
      startSubmitting(async () => {
        if (!sessionId) {
          setSubmissionError("No active session found.")
          return
        }
        const { attemptId, error } = await submitSession(sessionId)
        if (error || !attemptId) {
          setSubmissionError(error ?? "Could not submit session.")
          return
        }
        // Redirect to the dedicated results page
        router.push(`/training/${moduleId}/results?attempt=${attemptId}`)
      })
    }
  }

  // -------------------------------------------------------------------------
  // Progress bar
  // -------------------------------------------------------------------------
  const answeredCount = Object.keys(results).length

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-ppf-sky transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-lg border border-ppf-sky/20 bg-white p-6 shadow-sm">
        {/* Type badge */}
        <span className="mb-4 inline-block rounded-full bg-ppf-pale px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-ppf-sky">
          {currentQuestion.question_type === "flashcard" ? "Flash card" : "MCQ"}
        </span>

        {/* Question text */}
        <p className="mb-6 text-base font-medium text-ppf-navy leading-relaxed whitespace-pre-wrap">
          {currentQuestion.question_text}
        </p>

        {/* ------------------------------------------------------------------ */}
        {/* Flashcard */}
        {/* ------------------------------------------------------------------ */}
        {currentQuestion.question_type === "flashcard" && (
          <div>
            {!revealed && !isAnswered && (
              <button
                onClick={() => setRevealed(true)}
                className="w-full rounded-md border-2 border-dashed border-ppf-sky/40 py-8 text-sm font-medium text-ppf-sky transition-colors hover:border-ppf-sky hover:bg-ppf-pale"
              >
                Click to reveal answer
              </button>
            )}

            {(revealed || isAnswered) && (
              <div className="rounded-md border border-ppf-sky/20 bg-ppf-pale px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {currentResult
                  ? currentResult.correctAnswer
                  : <span className="italic text-slate-400">Loading…</span>}
              </div>
            )}

            {/* Self-assessment buttons — only shown before the user has answered */}
            {revealed && !isAnswered && !isChecking && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleFlashcardResult(true)}
                  className="flex-1 rounded-md bg-green-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                >
                  Got it ✓
                </button>
                <button
                  onClick={() => handleFlashcardResult(false)}
                  className="flex-1 rounded-md border border-red-300 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  Not yet ✗
                </button>
              </div>
            )}

            {isChecking && !isAnswered && (
              <p className="mt-4 text-center text-sm text-slate-400">Saving…</p>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MCQ */}
        {/* ------------------------------------------------------------------ */}
        {currentQuestion.question_type === "mcq" && currentQuestion.options && (
          <div className="flex flex-col gap-2">
            {currentQuestion.options.map((option) => {
              // Determine the visual state of this option after answering
              let optionStyle = "border-slate-200 text-slate-700 hover:border-ppf-sky hover:bg-ppf-pale cursor-pointer"
              if (isAnswered) {
                if (option.id === currentResult.correctAnswer) {
                  optionStyle = "border-green-400 bg-green-50 text-green-800"
                } else if (option.id === selectedOption && !currentResult.correct) {
                  optionStyle = "border-red-400 bg-red-50 text-red-700"
                } else {
                  optionStyle = "border-slate-100 text-slate-400"
                }
              } else if (option.id === selectedOption && isChecking) {
                optionStyle = "border-ppf-sky bg-ppf-pale text-ppf-navy cursor-wait"
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleMCQSelect(option.id)}
                  disabled={isAnswered || isChecking}
                  className={`w-full rounded-md border-2 px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${optionStyle}`}
                >
                  <span className="mr-2 font-bold">{option.id}.</span>
                  {option.text}
                </button>
              )
            })}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Result + explanation (shown after answering) */}
        {/* ------------------------------------------------------------------ */}
        {isAnswered && (
          <div className={`mt-5 rounded-md px-4 py-3 text-sm ${
            currentResult.correct
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}>
            <p className="font-semibold mb-1">
              {currentResult.correct ? "Correct!" : "Not quite."}
              {!currentResult.correct && currentQuestion.question_type === "mcq" && currentResult.correctAnswer && (
                <span className="font-normal"> The correct answer was <strong>{currentResult.correctAnswer}</strong>.</span>
              )}
            </p>
            {currentResult.explanation && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {currentResult.explanation}
              </p>
            )}
          </div>
        )}

        {/* Submission error */}
        {submissionError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not submit: {submissionError}
          </div>
        )}

        {/* Next / Finish button */}
        {isAnswered && (
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="mt-5 w-full rounded-md bg-ppf-sky py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-60"
          >
            {isSubmitting
              ? "Submitting…"
              : currentIndex < questions.length - 1
              ? "Next question →"
              : "Finish & see results"}
          </button>
        )}
      </div>
    </div>
  )
}
