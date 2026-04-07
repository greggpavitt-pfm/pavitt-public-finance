// /advisor/[conversationId] — View and continue a conversation

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import MessageThread from "@/components/advisor/MessageThread"
import TransactionInput from "@/components/advisor/TransactionInput"

interface AdvisorConversationPageProps {
  params: Promise<{
    conversationId: string
  }>
}

export default async function AdvisorConversationPage(
  props: AdvisorConversationPageProps
) {
  const params = await props.params
  const { conversationId } = params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch conversation (ownership check via RLS)
  const { data: conversation, error: convError } = await supabase
    .from("advisor_conversations")
    .select("id, title, output_mode, context_snapshot, status, created_at")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single()

  if (convError || !conversation) {
    redirect("/advisor")
  }

  // Fetch all messages in this conversation
  const { data: messages } = await supabase
    .from("advisor_messages")
    .select(
      "id, role, content, citations, topics_matched, standards_cited, complexity, clarifying_questions, clarifying_answers, created_at"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  // Check if the last message has unanswered clarifying questions
  const lastMessage = messages?.[messages.length - 1]
  const hasPendingClarifyingQuestions =
    lastMessage?.role === "assistant" &&
    lastMessage?.clarifying_questions &&
    !lastMessage?.clarifying_answers

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">{conversation.title}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Mode: {conversation.output_mode === "quick_treatment" ? "Quick Treatment" : conversation.output_mode}
        </p>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-auto">
        <MessageThread messages={messages || []} conversationId={conversationId} />
      </div>

      {/* Input Area — hidden while clarifying questions are pending */}
      {!hasPendingClarifyingQuestions && (
        <div className="border-t border-gray-200 bg-white px-8 py-6">
          <TransactionInput conversationId={conversationId} />
        </div>
      )}
    </div>
  )
}
