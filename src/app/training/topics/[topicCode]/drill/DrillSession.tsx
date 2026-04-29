"use client"
// DrillSession — client-side drill loop for a single topic session.
//
// Handles both MCQ and flashcard question types.
// No session table is written — this is untracked practice.
// Correct answers are fetched via checkAnswer (server action, service_role key)
// so correct_answer never reaches the browser as initial page HTML.

import { useState, useTransition, useCallback } from "react"
import Link from "next/link"
import { checkAnswer } from "@/app/training/actions"
import type { DrillQuestion } from "./page"

interface Props {
  topicCode: string
  topicName: string
  difficulty?: string
  questions: DrillQuestion[]
  backHref: string
}

interface AnswerResult {
  correct: boolean
  correctAnswer: string
  explanation: string | null
}

// Fisher-Yates shuffle (mutates array copy)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type DrillState = "drilling" | "finished"

export default function DrillSession({ topicCode, topicName, difficulty, questions, backHref }: Props) {
  // Shuffle once on mount
  const [queue] = useState<DrillQuestion[]>(() => shuffle(questions))

  const [state, setState] = useState<DrillState>("drilling")
  const [currentIndex, setCurrentIndex] = useState(0)

  // MCQ state
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [isChecking, startChecking] = useTransition()

  // Flashcard state
  const [cardFlipped, setCardFlipped] = useState(false)

  // End-of-drill stats
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)

  const currentQuestion = queue[currentIndex]
  const progressPercent = Math.round((currentIndex / queue.length) * 100)

  // -------------------------------------------------------------------------
  // Advance to next question or end the session
  // -------------------------------------------------------------------------
  const advance = useCallback(() => {
    if (currentIndex + 1 >= queue.length) {
      setState("finished")
    } else {
      setCurrentIndex((i) => i + 1)
      setSelectedOption(null)
      setAnswerResult(null)
      setCardFlipped(false)
    }
  }, [currentIndex, queue.length])

  // -------------------------------------------------------------------------
  // MCQ: user selects an option
  // -------------------------------------------------------------------------
  function handleMCQSelect(optionId: string) {
    if (answerResult || isChecking) return
    setSelectedOption(optionId)
    startChecking(async () => {
      const result = await checkAnswer(currentQuestion.id, optionId)
      setAnswerResult({
        correct: result.correct,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
      })
      setTotalAnswered((n) => n + 1)
      if (result.correct) setCorrectCount((n) => n + 1)
    })
  }

  // -------------------------------------------------------------------------
  // Flashcard: self-rating buttons
  // -------------------------------------------------------------------------
  function handleFlashcardRate(rating: "correct" | "almost" | "wrong") {
    setTotalAnswered((n) => n + 1)
    if (rating === "correct") setCorrectCount((n) => n + 1)
    advance()
  }

  // -------------------------------------------------------------------------
  // Finished screen
  // -------------------------------------------------------------------------
  if (state === "finished") {
    const pct = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0
    return (
      <div className="rounded-lg border border-ppf-sky/20 bg-white p-8 text-center shadow-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ppf-sky">
          Drill Complete
        </p>
        <h2 className="mb-2 text-2xl font-bold text-ppf-navy">{topicCode}</h2>
        <p className="mb-6 text-slate-500">{topicName}</p>

        <div className="mb-8 inline-flex flex-col items-center gap-1">
          <span className="text-5xl font-bold text-ppf-navy">{pct}%</span>
          <span className="text-sm text-slate-400">
            {correctCount} of {totalAnswered} correct
          </span>
          {totalAnswered < queue.length && (
            <span className="text-xs text-slate-300">
              ({queue.length - totalAnswered} skipped)
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              // Restart with a fresh shuffle — re-mount by resetting state
              window.location.reload()
            }}
            className="w-full rounded-md bg-ppf-sky py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue"
          >
            Drill again
          </button>
          <Link
            href={backHref}
            className="w-full rounded-md border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-600 transition-colors hover:border-ppf-sky hover:text-ppf-sky"
          >
            Back to topic
          </Link>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Active drill
  // -------------------------------------------------------------------------
  const isAnswered = !!answerResult

  return (
    <div>
      {/* Header: topic + progress */}
      <div className="mb-5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-ppf-sky">{topicCode}</span>
          <span className="text-xs text-slate-400">
            {currentIndex + 1} / {queue.length}
            {difficulty && ` · ${difficulty}`}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-ppf-sky transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-lg border border-ppf-sky/20 bg-white p-5 md:p-7 shadow-sm">
        {/* Type badge */}
        <span className="mb-4 inline-block rounded-full bg-ppf-pale px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-ppf-sky">
          {currentQuestion.question_type === "flashcard" ? "Flash card" : "MCQ"}
        </span>

        {/* Question / front of flashcard */}
        <p className="mb-6 text-base font-medium text-ppf-navy leading-relaxed whitespace-pre-wrap">
          {currentQuestion.question_text}
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* MCQ options */}
        {/* ---------------------------------------------------------------- */}
        {currentQuestion.question_type === "mcq" && currentQuestion.options && (
          <div className="flex flex-col gap-2">
            {currentQuestion.options.map((option) => {
              let optionStyle = "border-slate-200 text-slate-700 hover:border-ppf-sky hover:bg-ppf-pale cursor-pointer"
              if (answerResult) {
                if (option.id === answerResult.correctAnswer) {
                  optionStyle = "border-green-400 bg-green-50 text-green-800"
                } else if (option.id === selectedOption && !answerResult.correct) {
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

        {/* MCQ result + explanation */}
        {currentQuestion.question_type === "mcq" && answerResult && (
          <div className={`mt-5 rounded-md px-4 py-3 text-sm ${
            answerResult.correct
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}>
            <p className="font-semibold mb-1">
              {answerResult.correct ? "Correct!" : "Not quite."}
              {!answerResult.correct && answerResult.correctAnswer && (
                <span className="font-normal"> Correct answer: <strong>{answerResult.correctAnswer}</strong>.</span>
              )}
            </p>
            {answerResult.explanation && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{answerResult.explanation}</p>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Flashcard */}
        {/* ---------------------------------------------------------------- */}
        {currentQuestion.question_type === "flashcard" && (
          <>
            {!cardFlipped ? (
              <button
                onClick={() => setCardFlipped(true)}
                className="w-full rounded-md border-2 border-dashed border-ppf-sky/30 py-4 text-sm font-medium text-ppf-sky transition-colors hover:border-ppf-sky hover:bg-ppf-pale"
              >
                Flip to see answer →
              </button>
            ) : (
              <div className="rounded-md border border-ppf-sky/20 bg-ppf-pale px-4 py-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ppf-sky">Answer</p>
                <p className="text-sm text-ppf-navy leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.explanation ?? "—"}
                </p>
              </div>
            )}
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Next / self-rate buttons */}
        {/* ---------------------------------------------------------------- */}
        <div className="mt-5">
          {currentQuestion.question_type === "mcq" && isAnswered && (
            <button
              onClick={advance}
              className="w-full rounded-md bg-ppf-sky py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue"
            >
              {currentIndex + 1 < queue.length ? "Next question →" : "Finish drill"}
            </button>
          )}

          {currentQuestion.question_type === "flashcard" && cardFlipped && (
            <div className="flex gap-2">
              <button
                onClick={() => handleFlashcardRate("wrong")}
                className="flex-1 rounded-md border-2 border-red-200 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                Try again
              </button>
              <button
                onClick={() => handleFlashcardRate("almost")}
                className="flex-1 rounded-md border-2 border-amber-200 py-2.5 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50"
              >
                Almost
              </button>
              <button
                onClick={() => handleFlashcardRate("correct")}
                className="flex-1 rounded-md border-2 border-green-200 py-2.5 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50"
              >
                Got it
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quit link */}
      <div className="mt-5 text-center">
        <Link
          href={backHref}
          className="text-sm text-slate-400 hover:text-ppf-sky hover:underline"
        >
          Quit drill
        </Link>
      </div>
    </div>
  )
}
