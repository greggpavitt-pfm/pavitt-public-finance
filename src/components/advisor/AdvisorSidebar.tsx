"use client"
// Sidebar for advisor routes — shows conversation list and output mode selector

import Link from "next/link"
import { useState, useEffect } from "react"
import { listConversations } from "@/app/advisor/actions"

interface Conversation {
  id: string
  title: string
  created_at: string
}

export default function AdvisorSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConversations = async () => {
      const result = await listConversations()
      if (!result.error && result.conversations) {
        setConversations(result.conversations as Conversation[])
      }
      setLoading(false)
    }
    loadConversations()
  }, [])

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <Link
          href="/advisor"
          className="block rounded-lg bg-ppf-blue px-4 py-2 text-center text-sm font-semibold text-white hover:bg-ppf-sky transition-colors"
        >
          New Conversation
        </Link>
      </div>

      {/* Output Mode Info */}
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Output Mode</h3>
        <p className="mt-2 text-sm text-gray-600">
          Quick Treatment — Recognition, measurement, disclosure, and citations
        </p>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Recent Conversations
        </h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : conversations.length > 0 ? (
          <ul className="space-y-2">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <Link
                  href={`/advisor/${conv.id}`}
                  className="block truncate rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                  title={conv.title}
                >
                  {conv.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No conversations yet</p>
        )}
      </div>
    </aside>
  )
}
