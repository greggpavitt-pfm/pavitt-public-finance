"use client"
// List of past conversations

import Link from "next/link"

interface ConversationListProps {
  conversations: Array<{
    id: string
    title: string
    created_at: string
    updated_at: string
  }>
}

export default function ConversationList({ conversations }: ConversationListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    })
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/advisor/${conv.id}`}
          className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-ppf-blue hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-gray-900">{conv.title}</h3>
          <p className="mt-1 text-sm text-gray-500">
            Updated {formatDate(conv.updated_at)}
          </p>
        </Link>
      ))}
    </div>
  )
}
