"use client"
// Transaction input — text area for user to describe their accounting question

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { sendMessage, createConversation } from "@/app/advisor/actions"

interface TransactionInputProps {
  conversationId: string
}

export default function TransactionInput({ conversationId }: TransactionInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
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

    setSending(true)
    const result = await sendMessage(conversationId, message)
    setSending(false)

    if (!result.error) {
      setMessage("")
      // Refresh the page to show new message
      router.refresh()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  return (
    <div className="space-y-3">
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
