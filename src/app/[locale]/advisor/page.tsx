// /advisor — Main page for the Practitioner Advisor
// Shows: Context panel + option to start new conversation or view past conversations.
// Layout (AuthNavbar + AdvisorSidebar) is applied via src/app/advisor/layout.tsx.

import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ContextPanel from "@/components/advisor/ContextPanel"
import ConversationList from "@/components/advisor/ConversationList"
import PdfUploadPanel from "@/components/advisor/PdfUploadPanel"

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

      {/* Quick links — Training modules */}
      <div className="flex items-center gap-3 rounded-lg border border-ppf-sky/30 bg-ppf-pale px-5 py-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 shrink-0 text-ppf-sky">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
        </svg>
        <p className="text-sm text-ppf-navy">
          You also have access to IPSAS training modules.{" "}
          <Link href="/training" className="font-semibold text-ppf-sky hover:underline">
            Go to Training
          </Link>
        </p>
      </div>

      {/* Context Panel — Set jurisdiction, entity type, reporting basis, currency */}
      <ContextPanel initialContext={context || defaultContext} />

      {/* Start New Conversation — with optional PDF upload */}
      <PdfUploadPanel />

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
