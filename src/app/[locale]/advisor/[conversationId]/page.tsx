// /advisor/[conversationId] — View and continue a conversation

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import MessageThread from "@/components/advisor/MessageThread"
import TransactionInput from "@/components/advisor/TransactionInput"
import DocumentAttachment from "@/components/advisor/DocumentAttachment"
import PrintButton from "@/components/advisor/PrintButton"
import { getConversationDocuments } from "@/app/[locale]/advisor/actions"

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

  // Fetch PDF documents attached to this conversation (if any)
  const { documents } = await getConversationDocuments(conversationId)

  // Fetch all messages in this conversation
  const { data: messages } = await supabase
    .from("advisor_messages")
    .select(
      "id, role, content, citations, topics_matched, standards_cited, complexity, clarifying_questions, clarifying_answers, structured_response, created_at"
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
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{conversation.title}</h1>
            <p className="mt-1 text-sm text-gray-600">
              Mode: {conversation.output_mode === "quick_treatment" ? "Quick Treatment" : conversation.output_mode}
            </p>
          </div>
          <div className="shrink-0">
            <PrintButton />
          </div>
        </div>

        {/* Attached PDF documents */}
        {documents && documents.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Attached Documents
            </p>
            <div className="space-y-2">
              {documents.map((doc) => (
                <DocumentAttachment key={doc.id} document={doc} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Print-only header strip — not visible on screen, appears at top of
          the printed PDF so the user has a date-stamped reference. */}
      <div className="print-only border-b border-gray-300 px-8 py-3 text-xs text-gray-700">
        <div className="flex justify-between">
          <span>
            <strong>IPSAS Advisor — </strong>
            {conversation.title}
          </span>
          <span>Printed {new Date().toISOString().slice(0, 10)}</span>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-auto">
        <MessageThread messages={messages || []} conversationId={conversationId} />
      </div>

      {/* Input Area — hidden while clarifying questions are pending and on print */}
      {!hasPendingClarifyingQuestions && (
        <div className="no-print border-t border-gray-200 bg-white px-8 py-6">
          <TransactionInput conversationId={conversationId} />
        </div>
      )}
    </div>
  )
}
