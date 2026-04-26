// Assistant message with citations and metadata.
//
// Two render paths:
//   1. structured_response present → card-based renderer (TreatmentCards)
//   2. legacy/markdown fallback → original chat-bubble formatter below
//
// Path 1 is the preferred output for any new message generated after the
// structured-response migration. Path 2 stays so historical conversations
// (pre-migration) keep rendering.

import FeedbackButtons from "./FeedbackButtons"
import TreatmentCards from "./TreatmentCards"
import type { QuickTreatmentResponse } from "@/app/advisor/actions"

interface Citation {
  standard: string
  paragraph: string
  text: string
}

interface AssistantMessageProps {
  content: string
  citations?: Citation[]
  complexity?: string
  standardsCited?: string[]
  messageId?: string
  // jsonb from Supabase — typed as unknown so we narrow before passing on.
  structuredResponse?: unknown
}

// Minimal duck-typing — a structured_response only counts if it has the
// fields the cards rely on. Avoids rendering broken cards when an older
// row has a partial payload.
function isQuickTreatment(obj: unknown): obj is QuickTreatmentResponse {
  if (!obj || typeof obj !== "object") return false
  const o = obj as Record<string, unknown>
  return (
    Array.isArray(o.applicable_standards) &&
    typeof o.why_applies === "string" &&
    typeof o.complexity === "string" &&
    typeof o.recognition_criteria === "string"
  )
}

export default function AssistantMessage({
  content,
  citations,
  complexity,
  standardsCited,
  messageId,
  structuredResponse,
}: AssistantMessageProps) {
  // Preferred path: structured cards
  if (isQuickTreatment(structuredResponse)) {
    return (
      <div className="flex justify-start">
        <div className="w-full max-w-4xl">
          <TreatmentCards treatment={structuredResponse} />
          {messageId && <FeedbackButtons messageId={messageId} />}
        </div>
      </div>
    )
  }
  // Legacy path: markdown chat bubble (kept verbatim from prior version)
  const formatContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Handle headings
      if (line.startsWith("## ")) {
        return (
          <h3 key={i} className="mt-4 mb-2 text-lg font-semibold text-gray-900">
            {line.slice(3)}
          </h3>
        )
      }
      // Handle list items
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="ml-4 text-gray-700">
            {line.slice(2)}
          </li>
        )
      }
      // Handle bold text
      if (line.includes("**")) {
        return (
          <p key={i} className="text-gray-700">
            {line.split("**").map((part, j) =>
              j % 2 === 0 ? part : <strong key={j}>{part}</strong>
            )}
          </p>
        )
      }
      // Regular paragraphs
      if (line.trim()) {
        return (
          <p key={i} className="text-gray-700">
            {line}
          </p>
        )
      }
      return null
    })
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-2xl rounded-lg border border-gray-200 bg-gray-50 p-6">
        {/* Metadata badges */}
        <div className="mb-4 flex flex-wrap gap-2">
          {complexity && (
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold text-white ${
                complexity === "Straightforward"
                  ? "bg-green-600"
                  : complexity === "Moderate"
                    ? "bg-yellow-600"
                    : "bg-red-600"
              }`}
            >
              {complexity}
            </span>
          )}
          {standardsCited && standardsCited.length > 0 && (
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
              {standardsCited.length} standard{standardsCited.length !== 1 ? "s" : ""} cited
            </span>
          )}
        </div>

        {/* Content */}
        <div className="mb-6 space-y-2 text-gray-800">
          {formatContent(content)}
        </div>

        {/* Citations section */}
        {citations && citations.length > 0 && (
          <div className="border-t border-gray-300 pt-4">
            <h4 className="mb-3 font-semibold text-gray-900">Sources</h4>
            <ul className="space-y-2">
              {citations.map((citation, i) => (
                <li key={i} className="text-sm text-gray-700">
                  <span className="font-semibold">{citation.standard} {citation.paragraph}</span>
                  {citation.text && (
                    <>
                      :{" "}
                      <span className="italic">{citation.text.substring(0, 100)}</span>
                      {citation.text.length > 100 ? "..." : ""}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Feedback */}
        {messageId && <FeedbackButtons messageId={messageId} />}
      </div>
    </div>
  )
}
