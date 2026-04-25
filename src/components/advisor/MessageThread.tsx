"use client"
// Message thread — displays all messages in a conversation

import UserMessage from "./UserMessage"
import AssistantMessage from "./AssistantMessage"
import ClarifyingQuestions from "./ClarifyingQuestions"

interface Message {
  id: string
  role: string
  content: string
  citations?: Record<string, unknown>
  topics_matched?: string[]
  standards_cited?: string[]
  complexity?: string
  clarifying_questions?: Record<string, unknown>
  clarifying_answers?: Record<string, unknown>
  created_at: string
}

interface MessageThreadProps {
  messages: Message[]
  conversationId?: string
}

export default function MessageThread({ messages, conversationId }: MessageThreadProps) {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No messages yet. Ask your first question below.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-8">
      {messages.map((message, idx) => {
        if (message.role === "user") {
          return message.content ? <UserMessage key={message.id} content={message.content} /> : null
        } else if (message.role === "assistant") {
          // Check if this is a clarifying questions response
          if (message.clarifying_questions && !message.clarifying_answers) {
            return (
              <div key={message.id}>
                {message.content && <AssistantMessage content={message.content} />}
                {conversationId && (
                  <ClarifyingQuestions
                    questions={message.clarifying_questions as any}
                    conversationId={conversationId}
                  />
                )}
              </div>
            )
          }

          // Regular treatment response
          return (
            <AssistantMessage
              key={message.id}
              messageId={message.id}
              content={message.content}
              citations={message.citations as any}
              complexity={message.complexity}
              standardsCited={message.standards_cited}
            />
          )
        }
        return null
      })}
    </div>
  )
}
