"use client"
// Button to start a new conversation

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createConversation } from "@/app/[locale]/advisor/actions"

export default function StartConversationButton() {
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  const handleStartConversation = async () => {
    setCreating(true)
    const result = await createConversation(
      "New Conversation",
      "quick_treatment"
    )
    setCreating(false)

    if (result.conversationId) {
      router.push(`/advisor/${result.conversationId}`)
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
      <h2 className="text-lg font-bold text-blue-900 mb-2">Start a New Question</h2>
      <p className="text-sm text-blue-800 mb-4">
        After setting your context above, click below to begin a new conversation with the IPSAS advisor.
      </p>
      <button
        onClick={handleStartConversation}
        disabled={creating}
        className="rounded-lg bg-ppf-blue px-6 py-3 font-semibold text-white hover:bg-ppf-sky disabled:opacity-50 transition-colors"
      >
        {creating ? "Creating..." : "Start New Conversation"}
      </button>
    </div>
  )
}
