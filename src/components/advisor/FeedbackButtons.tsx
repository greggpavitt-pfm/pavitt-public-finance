"use client"
// Thumbs up/down + optional comment for an assistant message.
// Submitting overwrites any prior vote from the same user on the same message.

import { useState, useTransition } from "react"
import { submitMessageFeedback } from "@/app/advisor/actions"

interface Props {
  messageId: string
  initialVote?: "up" | "down" | null
}

export default function FeedbackButtons({ messageId, initialVote = null }: Props) {
  const [vote, setVote] = useState<"up" | "down" | null>(initialVote)
  const [comment, setComment] = useState("")
  const [showComment, setShowComment] = useState(false)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")

  function handleVote(newVote: "up" | "down") {
    setVote(newVote)
    setStatus("idle")

    // For thumbs-down, prompt for an optional comment first
    if (newVote === "down") {
      setShowComment(true)
      return
    }

    // Up-vote saves immediately
    startTransition(async () => {
      const result = await submitMessageFeedback(messageId, newVote)
      setStatus(result.ok ? "saved" : "error")
    })
  }

  function handleSubmitComment() {
    if (!vote) return
    startTransition(async () => {
      const result = await submitMessageFeedback(messageId, vote, comment)
      setStatus(result.ok ? "saved" : "error")
      if (result.ok) setShowComment(false)
    })
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">Was this helpful?</span>
        <button
          type="button"
          onClick={() => handleVote("up")}
          disabled={pending}
          aria-label="Helpful"
          aria-pressed={vote === "up"}
          className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
            vote === "up"
              ? "border-success/40 bg-success-bg text-success-fg"
              : "border-slate-200 bg-white text-slate-500 hover:border-success/40 hover:text-success-fg"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M7 22V11" />
            <path d="M7 11l4-9c1.5 0 2.5 1 2.5 2.5V8h5.5c1.1 0 2 .9 2 2 0 .2 0 .4-.1.6l-2.4 8.4c-.3 1.2-1.4 2-2.6 2H7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleVote("down")}
          disabled={pending}
          aria-label="Not helpful"
          aria-pressed={vote === "down"}
          className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
            vote === "down"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-slate-200 bg-white text-slate-500 hover:border-red-300 hover:text-red-600"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M17 2v11" />
            <path d="M17 13l-4 9c-1.5 0-2.5-1-2.5-2.5V16H5c-1.1 0-2-.9-2-2 0-.2 0-.4.1-.6L5.5 5c.3-1.2 1.4-2 2.6-2H17" />
          </svg>
        </button>

        {status === "saved" && (
          <span className="text-xs text-success-fg">Thanks — feedback saved.</span>
        )}
        {status === "error" && (
          <span className="text-xs text-red-600">Could not save — try again.</span>
        )}
      </div>

      {showComment && vote === "down" && (
        <div className="mt-3">
          <label htmlFor={`fb-${messageId}`} className="text-xs text-slate-600">
            What was wrong? (optional, helps us improve)
          </label>
          <textarea
            id={`fb-${messageId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={1000}
            className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:border-ppf-sky focus:outline-none"
            placeholder="e.g. wrong standard cited, missing measurement guidance, unclear language"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={pending}
              className="rounded-md bg-ppf-sky px-3 py-1.5 text-xs font-semibold text-white hover:bg-ppf-sky-hover disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send feedback"}
            </button>
            <button
              type="button"
              onClick={() => setShowComment(false)}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
