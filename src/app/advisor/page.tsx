// /advisor — Main page for the Practitioner Advisor
// Shows: Context panel + option to start new conversation or view past conversations

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ContextPanel from "@/components/advisor/ContextPanel"
import ConversationList from "@/components/advisor/ConversationList"
import StartConversationButton from "@/components/advisor/StartConversationButton"

export default async function AdvisorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch user's current context
  const { data: context } = await supabase
    .from("advisor_contexts")
    .select("jurisdiction, entity_type, reporting_basis, functional_currency, reporting_period")
    .eq("user_id", user.id)
    .single()

  // Fetch user's conversations
  const { data: conversations } = await supabase
    .from("advisor_conversations")
    .select("id, title, created_at, updated_at, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("updated_at", { ascending: false })

  const defaultContext = {
    jurisdiction: "Generic IPSAS",
    entity_type: "Central Government",
    reporting_basis: "Accrual IPSAS",
    functional_currency: "USD",
    reporting_period: null,
  }

  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">IPSAS Practitioner Advisor</h1>
        <p className="mt-2 text-gray-600">
          Ask questions about IPSAS accounting treatments. The advisor will provide citations
          and practical guidance tailored to your entity.
        </p>
      </div>

      {/* Context Panel — Set jurisdiction, entity type, reporting basis, currency */}
      <ContextPanel initialContext={context || defaultContext} />

      {/* Start New Conversation Button */}
      <StartConversationButton />

      {/* Conversations */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Conversations</h2>
        {conversations && conversations.length > 0 ? (
          <ConversationList conversations={conversations} />
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="text-gray-600">
              No conversations yet. Set your context above and start a conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
