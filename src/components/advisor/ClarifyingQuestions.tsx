"use client"
// Display clarifying questions with clickable option buttons

import { useState } from "react"
import { useRouter } from "next/navigation"
import { sendMessage } from "@/app/advisor/actions"

interface ClarifyingQuestion {
  id: string
  text: string
  options: string[]
}

interface ClarifyingQuestionsProps {
  questions: ClarifyingQuestion[]
  conversationId: string
  onAnswerSubmit?: () => void
}

export default function ClarifyingQuestions({
  questions,
  conversationId,
  onAnswerSubmit,
}: ClarifyingQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const allAnswered = questions.every((q) => answers[q.id])

  const handleSubmitAnswers = async () => {
    setSubmitting(true)
    const result = await sendMessage(conversationId, "", answers)
    setSubmitting(false)

    if (!result.error) {
      setAnswers({})
      router.refresh()
      onAnswerSubmit?.()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  return (
    <div className="rounded-lg border border-blue-300 bg-blue-50 p-6">
      <h3 className="font-semibold text-blue-900 mb-6">
        I need to understand your situation better
      </h3>

      <div className="space-y-6">
        {questions.map((question) => (
          <div key={question.id}>
            <p className="mb-3 font-medium text-gray-900">{question.text}</p>
            <div className="space-y-2">
              {question.options.map((option) => (
                <button
                  key={`${question.id}-${option}`}
                  onClick={() => setAnswers({ ...answers, [question.id]: option })}
                  className={`block w-full text-left rounded-lg border-2 px-4 py-3 transition-all ${
                    answers[question.id] === option
                      ? "border-ppf-blue bg-blue-100 text-gray-900 font-medium"
                      : "border-gray-300 bg-white text-gray-700 hover:border-ppf-blue hover:bg-gray-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          onClick={handleSubmitAnswers}
          disabled={!allAnswered || submitting}
          className="rounded-lg bg-ppf-blue px-6 py-2 font-semibold text-white hover:bg-ppf-sky disabled:opacity-50 transition-colors"
        >
          {submitting ? "Analyzing..." : "Continue"}
        </button>
      </div>
    </div>
  )
}
