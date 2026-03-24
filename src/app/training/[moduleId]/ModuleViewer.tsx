"use client"
// ModuleViewer — handles the interactive flashcard + MCQ experience.
//
// Flow:
//   1. Questions are shown one at a time in sequence_number order.
//   2. Flashcards: user clicks "Reveal answer" to flip, then marks themselves
//      correct or incorrect. The correct answer comes back from the server
//      action (never pre-loaded into the page).
//   3. MCQs: user clicks an option, the server action checks it server-side,
//      then shows the result + explanation.
//   4. When all questions are done, a completion screen appears and
//      markModuleComplete is called.
//
// Correct answers are never in the initial page HTML — they are only
// returned by checkAnswer() after the user has already submitted.

import { useState, useTransition } from "react"
import { checkAnswer, markModuleComplete } from "@/app/training/actions"

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
  // Index of the current question being shown
  const [currentIndex, setCurrentIndex] = useState(0)

  // Map of questionId → result (populated when the user answers)
  const [results, setResults] = useState<Record<string, AnswerResult>>({})

  // For flashcards: whether the answer has been revealed
  const [revealed, setRevealed] = useState(false)

  // For MCQs: which option the user has clicked (before server round-trip)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  // Whether the module completion action is running
  const [isCompleting, startCompleting] = useTransition()
  const [isComplete, setIsComplete] = useState(false)
  const [completionError, setCompletionError] = useState<string | null>(null)

  // General pending state for checkAnswer calls
  const [isChecking, startChecking] = useTransition()

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
      setResults((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          correct: result.correct,
          correctAnswer: result.correctAnswer,
          explanation: result.explanation,
        },
      }))
    })
  }

  // Flashcard: called when user marks correct/incorrect after revealing
  function handleFlashcardResult(correct: boolean) {
    // For flashcards we still hit the server to get the explanation
    // (and to ensure we don't skip the server check), but we also pass
    // the user's self-assessment.
    startChecking(async () => {
      // Fetch the correct answer from the server so we can show it
      const result = await checkAnswer(currentQuestion.id, correct ? "__self_correct__" : "__self_incorrect__")
      setResults((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          correct,
          correctAnswer: result.correctAnswer,
          explanation: result.explanation,
        },
      }))
    })
  }

  // Advance to the next question or trigger completion
  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setRevealed(false)
      setSelectedOption(null)
    } else {
      // Last question answered — mark module complete
      startCompleting(async () => {
        const result = await markModuleComplete(moduleId)
        if (result.error) {
          setCompletionError(result.error)
        } else {
          setIsComplete(true)
        }
      })
    }
  }

  // -------------------------------------------------------------------------
  // Completion screen
  // -------------------------------------------------------------------------
  if (isComplete) {
    const correctCount = Object.values(results).filter((r) => r.correct).length
    const total = questions.length
    const percentage = Math.round((correctCount / total) * 100)

    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-green-800">Module complete!</h2>
        <p className="mb-1 text-green-700">
          You got <span className="font-semibold">{correctCount} of {total}</span> correct ({percentage}%)
        </p>
        <p className="mb-8 text-sm text-green-600">Your progress has been saved.</p>
        <a
          href="/training"
          className="inline-block rounded-md bg-ppf-sky px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue"
        >
          Back to modules
        </a>
      </div>
    )
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
              {!currentResult.correct && currentQuestion.question_type === "mcq" && (
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

        {/* Completion error */}
        {completionError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not save progress: {completionError}
          </div>
        )}

        {/* Next / Finish button */}
        {isAnswered && (
          <button
            onClick={handleNext}
            disabled={isCompleting}
            className="mt-5 w-full rounded-md bg-ppf-sky py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-60"
          >
            {isCompleting
              ? "Saving progress…"
              : currentIndex < questions.length - 1
              ? "Next question →"
              : "Finish module"}
          </button>
        )}
      </div>
    </div>
  )
}
