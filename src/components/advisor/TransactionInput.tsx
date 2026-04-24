"use client"
// Transaction input — text area for user to describe their accounting question

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { sendMessage } from "@/app/advisor/actions"

interface TransactionInputProps {
  conversationId: string
}

export default function TransactionInput({ conversationId }: TransactionInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  // Auto-expand textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [message])

  const handleSend = async () => {
    if (!message.trim()) return

    setSendError(null)
    setSending(true)
    const result = await sendMessage(conversationId, message)
    setSending(false)

    if (!result.error) {
      setMessage("")
      router.refresh()
    } else {
      setSendError(result.error)
    }
  }

  return (
    <div className="space-y-3">
      {sendError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {sendError}
        </p>
      )}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            handleSend()
          }
        }}
        placeholder="Describe your accounting transaction or question..."
        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-ppf-blue focus:ring-1 focus:ring-ppf-blue resize-none"
        rows={3}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Press Ctrl+Enter to send</p>
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="rounded-lg bg-ppf-blue px-6 py-2 font-semibold text-white hover:bg-ppf-sky disabled:opacity-50 transition-colors"
        >
          {sending ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </div>
  )
}
