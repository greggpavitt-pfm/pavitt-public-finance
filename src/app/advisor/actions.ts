"use server"
// Advisor server actions — Phase 2 IPSAS Practitioner Q&A system
//
// saveContext      — upsert user's context settings (jurisdiction, entity type, etc.)
// createConversation — start a new multi-turn Q&A conversation
// sendMessage      — process user message, call Anthropic SDK with tool-use,
//                     return structured LLM response with citations
// getConversation  — fetch full conversation thread + messages
// listConversations — fetch user's conversation list
// archiveConversation — mark conversation as archived

import { Anthropic } from "@anthropic-ai/sdk"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { readFileSync } from "fs"
import { join } from "path"

// ---------------------------------------------------------------------------
// Type definitions (structured output from LLM tool-use)
// ---------------------------------------------------------------------------

interface Citation {
  standard: string
  paragraph: string
  text: string
}

interface QuickTreatmentResponse {
  applicable_standards: Array<{
    standard_id: string
    title: string
  }>
  why_applies: string
  complexity: "Straightforward" | "Moderate" | "Complex"
  recognition_criteria: string
  measurement_guidance: string
  disclosure_requirements: string
  journal_entry?: string
  related_topics: string[]
  citations: Citation[]
}

interface ClarifyingQuestionsResponse {
  needs_clarification: true
  questions: Array<{
    id: string
    text: string
    options: string[]
  }>
}

type IPSASResponse = QuickTreatmentResponse | ClarifyingQuestionsResponse

// ---------------------------------------------------------------------------
// Helper: Load reference content for system prompt
// ---------------------------------------------------------------------------
// Loads curated IPSAS reference files from the skill directory.
// These provide high-quality prompt-based RAG context.

function loadReferenceContent(): string {
  try {
    // Path to the skill reference files
    const skillPath = join(process.cwd(), "projects/ipsas-advisor/.agents/skills/ipsas-accounting-advisor")

    // Try to load topic-map (primary reference)
    const topicMapPath = join(skillPath, "references/ipsas-topic-map.md")
    let content = ""

    try {
      content = readFileSync(topicMapPath, "utf-8")
      // Limit to first 80KB to avoid prompt bloat
      if (content.length > 80000) {
        content = content.substring(0, 80000) + "\n\n[... reference content truncated ...]"
      }
      return content
    } catch {
      // Topic map not found — fall back to empty, LLM will use general knowledge
      console.warn("Reference files not loaded; using LLM general IPSAS knowledge")
      return ""
    }
  } catch (err) {
    console.error("Error loading reference content:", err)
    return ""
  }
}

// ---------------------------------------------------------------------------
// Helper: Check daily token limit for user
// ---------------------------------------------------------------------------

async function checkTokenLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const serviceClient = await createServiceClient()

  // Get today's date in UTC
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Sum tokens used by this user today
  const { data: todaysMessages } = await serviceClient
    .from("advisor_messages")
    .select("token_count_in, token_count_out")
    .eq("role", "assistant")
    .gte("created_at", today.toISOString())

  const totalTokens = (todaysMessages ?? []).reduce(
    (sum, msg) => sum + (msg.token_count_in || 0) + (msg.token_count_out || 0),
    0
  )

  // Daily cap: 100k tokens per user (conservative for MVP)
  const dailyCap = 100000
  if (totalTokens >= dailyCap) {
    return { allowed: false, reason: `Daily token limit reached (${totalTokens}/${dailyCap})` }
  }

  return { allowed: true }
}

// ---------------------------------------------------------------------------
// Save or update user context
// ---------------------------------------------------------------------------
// Context includes jurisdiction, entity type, reporting basis, currency, reporting period.
// One row per user; upsert to update.

export async function saveContext(
  jurisdiction: string,
  entityType: string,
  reportingBasis: string,
  functionalCurrency: string,
  reportingPeriod: string
): Promise<{
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const serviceClient = await createServiceClient()

  const { error } = await serviceClient
    .from("advisor_contexts")
    .upsert(
      {
        user_id: user.id,
        jurisdiction,
        entity_type: entityType,
        reporting_basis: reportingBasis,
        functional_currency: functionalCurrency,
        reporting_period: reportingPeriod,
      },
      { onConflict: "user_id" }
    )

  if (error) {
    console.error("saveContext: upsert failed", { userId: user.id, error })
    return { error: error.message }
  }

  return {}
}

// ---------------------------------------------------------------------------
// Get user's current context (or defaults from profile)
// ---------------------------------------------------------------------------

export async function getContext(): Promise<{
  context: {
    jurisdiction: string
    entity_type: string
    reporting_basis: string
    functional_currency: string
    reporting_period: string
  } | null
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { context: null, error: "Not authenticated" }

  const serviceClient = await createServiceClient()

  const { data: context, error } = await serviceClient
    .from("advisor_contexts")
    .select("jurisdiction, entity_type, reporting_basis, functional_currency, reporting_period")
    .eq("user_id", user.id)
    .single()

  if (error) {
    console.error("getContext: fetch failed", { userId: user.id, error })
    return { context: null }
  }

  return { context }
}

// ---------------------------------------------------------------------------
// Create a new conversation
// ---------------------------------------------------------------------------
// Starts a new multi-turn Q&A thread. Snapshots the user's current context
// so answers remain consistent throughout the conversation.

export async function createConversation(
  title: string,
  outputMode: "quick_treatment" | "audit_memo" | "compare_treatments" = "quick_treatment"
): Promise<{
  conversationId: string | null
  contextSnapshot?: Record<string, unknown>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { conversationId: null, error: "Not authenticated" }

  const serviceClient = await createServiceClient()

  // Fetch user's current context to snapshot in the conversation
  const { data: context } = await serviceClient
    .from("advisor_contexts")
    .select("jurisdiction, entity_type, reporting_basis, functional_currency, reporting_period")
    .eq("user_id", user.id)
    .single()

  const contextSnapshot = context || {
    jurisdiction: "Generic IPSAS",
    entity_type: "Central Government",
    reporting_basis: "Accrual IPSAS",
    functional_currency: "USD",
    reporting_period: null,
  }

  const { data: conversation, error } = await serviceClient
    .from("advisor_conversations")
    .insert({
      user_id: user.id,
      title,
      output_mode: outputMode,
      context_snapshot: contextSnapshot,
      status: "active",
    })
    .select("id")
    .single()

  if (error || !conversation) {
    console.error("createConversation: insert failed", { userId: user.id, error })
    return { conversationId: null, error: error?.message ?? "Failed to create conversation" }
  }

  return { conversationId: conversation.id, contextSnapshot }
}

// ---------------------------------------------------------------------------
// List user's conversations
// ---------------------------------------------------------------------------

export async function listConversations(): Promise<{
  conversations: Array<{
    id: string
    title: string
    created_at: string
    updated_at: string
    status: string
    message_count?: number
  }>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { conversations: [], error: "Not authenticated" }

  const serviceClient = await createServiceClient()

  const { data: conversations, error } = await serviceClient
    .from("advisor_conversations")
    .select("id, title, created_at, updated_at, status")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("listConversations: fetch failed", { userId: user.id, error })
    return { conversations: [] }
  }

  return { conversations: conversations ?? [] }
}

// ---------------------------------------------------------------------------
// Get full conversation + all messages
// ---------------------------------------------------------------------------

export async function getConversation(conversationId: string): Promise<{
  conversation: {
    id: string
    title: string
    output_mode: string
    context_snapshot: Record<string, unknown>
    status: string
    created_at: string
  } | null
  messages: Array<{
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
  }>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { conversation: null, messages: [], error: "Not authenticated" }

  const serviceClient = await createServiceClient()

  // Fetch conversation (with ownership check)
  const { data: conversation, error: convError } = await serviceClient
    .from("advisor_conversations")
    .select("id, title, output_mode, context_snapshot, status, created_at")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single()

  if (convError || !conversation) {
    console.error("getConversation: not found", { conversationId, userId: user.id, error: convError })
    return { conversation: null, messages: [], error: "Conversation not found" }
  }

  // Fetch all messages in order
  const { data: messages, error: messError } = await serviceClient
    .from("advisor_messages")
    .select(
      "id, role, content, citations, topics_matched, standards_cited, complexity, clarifying_questions, clarifying_answers, created_at"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (messError) {
    console.error("getConversation: fetch messages failed", { conversationId, error: messError })
    return { conversation, messages: [], error: messError.message }
  }

  return { conversation, messages: messages ?? [] }
}

// ---------------------------------------------------------------------------
// Send a message to the advisor (main LLM interaction)
// ---------------------------------------------------------------------------
// User submits a question. System processes it with the Anthropic SDK using
// tool-use for structured output. Returns either clarifying questions or
// a full treatment (Quick Treatment mode).

export async function sendMessage(
  conversationId: string,
  userMessage: string = "",
  clarifyingAnswers?: Record<string, string>
): Promise<{
  messageId: string | null
  assistantMessage?: string
  citations?: Citation[]
  complexity?: string
  clarifyingQuestions?: Array<{ id: string; text: string; options: string[] }>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { messageId: null, error: "Not authenticated" }

  const serviceClient = await createServiceClient()

  // Check token limit
  const tokenCheck = await checkTokenLimit(user.id)
  if (!tokenCheck.allowed) {
    return { messageId: null, error: tokenCheck.reason }
  }

  // Verify conversation ownership
  const { data: conversation, error: convError } = await serviceClient
    .from("advisor_conversations")
    .select("id, context_snapshot, output_mode, title")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single()

  if (convError || !conversation) {
    return { messageId: null, error: "Conversation not found or not authorized" }
  }

  // If clarifying answers are provided, find the last user message and update it
  // with the answers (don't create a new user message)
  let userMsg: { id: string } | null = null

  if (clarifyingAnswers && Object.keys(clarifyingAnswers).length > 0) {
    // Find the last user message in this conversation
    const { data: lastUserMsg } = await serviceClient
      .from("advisor_messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (lastUserMsg) {
      // Update that message with the clarifying answers
      await serviceClient
        .from("advisor_messages")
        .update({ clarifying_answers: clarifyingAnswers })
        .eq("id", lastUserMsg.id)

      userMsg = lastUserMsg
    }
  } else if (userMessage.trim()) {
    // Save new user message
    const { data: newUserMsg, error: userMsgError } = await serviceClient
      .from("advisor_messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: userMessage,
      })
      .select("id")
      .single()

    if (userMsgError || !newUserMsg) {
      console.error("sendMessage: failed to save user message", { conversationId, error: userMsgError })
      return { messageId: null, error: "Failed to save message" }
    }

    userMsg = newUserMsg
  } else {
    return { messageId: null, error: "No message or answers provided" }
  }

  // Fetch conversation history (last 10 messages for context)
  const { data: messages } = await serviceClient
    .from("advisor_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(10)

  const conversationHistory = (messages ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }))

  // Build system prompt with context injection
  const context = conversation.context_snapshot as {
    jurisdiction: string
    entity_type: string
    reporting_basis: string
    functional_currency: string
    reporting_period: string
  }

  // Load reference content and build system prompt
  const referenceContent = loadReferenceContent()
  const systemPrompt = buildSystemPrompt(context, conversation.output_mode, referenceContent)

  // Call Anthropic API with tool-use for structured output
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error("sendMessage: ANTHROPIC_API_KEY not set")
    return { messageId: null, error: "API key not configured" }
  }

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      tools: [
        {
          name: "ipsas_response",
          description: "Structured IPSAS treatment response",
          input_schema: {
            type: "object",
            properties: {
              applicable_standards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    standard_id: { type: "string" },
                    title: { type: "string" },
                  },
                  required: ["standard_id", "title"],
                },
              },
              why_applies: { type: "string" },
              complexity: {
                type: "string",
                enum: ["Straightforward", "Moderate", "Complex"],
              },
              recognition_criteria: { type: "string" },
              measurement_guidance: { type: "string" },
              disclosure_requirements: { type: "string" },
              journal_entry: { type: "string" },
              related_topics: { type: "array", items: { type: "string" } },
              citations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    standard: { type: "string" },
                    paragraph: { type: "string" },
                    text: { type: "string" },
                  },
                  required: ["standard", "paragraph"],
                },
              },
            },
            required: [
              "applicable_standards",
              "why_applies",
              "complexity",
              "recognition_criteria",
              "measurement_guidance",
              "disclosure_requirements",
              "related_topics",
              "citations",
            ],
          },
        },
        {
          name: "clarifying_questions",
          description: "Questions to clarify the user's situation before providing treatment",
          input_schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    text: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                  },
                  required: ["id", "text", "options"],
                },
              },
            },
            required: ["questions"],
          },
        },
      ],
      messages: [
        ...conversationHistory,
        { role: "user", content: userMessage },
      ],
    })

    // Extract tool use from response
    let assistantContent = ""
    let toolUsed: "ipsas_response" | "clarifying_questions" | null = null
    let structuredOutput: IPSASResponse | null = null

    for (const block of response.content) {
      if (block.type === "text") {
        assistantContent = block.text
      } else if (block.type === "tool_use") {
        toolUsed = block.name as "ipsas_response" | "clarifying_questions"
        structuredOutput = block.input as IPSASResponse
      }
    }

    if (!toolUsed || !structuredOutput) {
      console.error("sendMessage: no tool use in response", { conversationId })
      return { messageId: null, error: "Invalid LLM response" }
    }

    // Handle clarifying questions flow
    if (toolUsed === "clarifying_questions" && "needs_clarification" in structuredOutput) {
      const clarQ = structuredOutput as ClarifyingQuestionsResponse

      // Save assistant message with questions
      const { data: assistantMsg, error: assistantError } = await serviceClient
        .from("advisor_messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: "I need to understand your situation better before providing a complete treatment.",
          clarifying_questions: clarQ.questions,
        })
        .select("id")
        .single()

      if (assistantError || !assistantMsg) {
        console.error("sendMessage: failed to save clarifying questions", { conversationId, error: assistantError })
        return { messageId: null, error: "Failed to save response" }
      }

      return {
        messageId: assistantMsg.id,
        assistantMessage: "I need to understand your situation better before providing a complete treatment.",
        clarifyingQuestions: clarQ.questions,
      }
    }

    // Handle full treatment (ipsas_response)
    if (toolUsed === "ipsas_response") {
      const treatment = structuredOutput as QuickTreatmentResponse

      // Build markdown response for display
      const standardsList = treatment.applicable_standards
        .map((s) => `- ${s.standard_id}: ${s.title}`)
        .join("\n")

      const citationsList = treatment.citations
        .map((c) => `- **${c.standard} ${c.paragraph}**: ${c.text}`)
        .join("\n")

      const responseContent = `
## Applicable Standards
${standardsList}

## Why This Applies
${treatment.why_applies}

**Complexity: ${treatment.complexity}**

## Recognition Criteria
${treatment.recognition_criteria}

## Measurement Guidance
${treatment.measurement_guidance}

## Disclosure Requirements
${treatment.disclosure_requirements}

${treatment.journal_entry ? `## Journal Entry\n${treatment.journal_entry}\n` : ""}

## Related Topics
${treatment.related_topics.map((t) => `- ${t}`).join("\n")}

## Citations
${citationsList}
`.trim()

      // Save assistant message
      const { data: assistantMsg, error: assistantError } = await serviceClient
        .from("advisor_messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: responseContent,
          citations: treatment.citations,
          standards_cited: treatment.applicable_standards.map((s) => s.standard_id),
          complexity: treatment.complexity,
          token_count_in: response.usage?.input_tokens ?? 0,
          token_count_out: response.usage?.output_tokens ?? 0,
        })
        .select("id")
        .single()

      if (assistantError || !assistantMsg) {
        console.error("sendMessage: failed to save treatment", { conversationId, error: assistantError })
        return { messageId: null, error: "Failed to save response" }
      }

      // Auto-update conversation title from first message (if title is still "New Conversation")
      if (conversation.title === "New Conversation") {
        const titleSummary = userMessage.substring(0, 60).replace(/\n/g, " ")
        await serviceClient
          .from("advisor_conversations")
          .update({ title: titleSummary })
          .eq("id", conversationId)
      }

      return {
        messageId: assistantMsg.id,
        assistantMessage: responseContent,
        citations: treatment.citations,
        complexity: treatment.complexity,
      }
    }

    return { messageId: null, error: "Unexpected response format" }
  } catch (err) {
    console.error("sendMessage: Anthropic API error", { conversationId, error: err })
    return { messageId: null, error: err instanceof Error ? err.message : "LLM error" }
  }
}

// ---------------------------------------------------------------------------
// Archive a conversation
// ---------------------------------------------------------------------------

export async function archiveConversation(conversationId: string): Promise<{
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const serviceClient = await createServiceClient()

  const { error } = await serviceClient
    .from("advisor_conversations")
    .update({ status: "archived" })
    .eq("id", conversationId)
    .eq("user_id", user.id)

  if (error) {
    console.error("archiveConversation: update failed", { conversationId, error })
    return { error: error.message }
  }

  return {}
}

// ---------------------------------------------------------------------------
// Build dynamic system prompt with context injection
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  context: {
    jurisdiction: string
    entity_type: string
    reporting_basis: string
    functional_currency: string
    reporting_period: string
  },
  outputMode: string,
  referenceContent: string
): string {
  const referenceSection = referenceContent
    ? `## Reference Knowledge Base

Below is curated IPSAS reference material. Use this as your authoritative source for standards citations and guidance.

\`\`\`
${referenceContent}
\`\`\`

---

`
    : ""

  return `You are an IPSAS (International Public Sector Accounting Standards) advisor for public sector practitioners.

## Your Context
- Jurisdiction: ${context.jurisdiction}
- Entity Type: ${context.entity_type}
- Reporting Basis: ${context.reporting_basis}
- Functional Currency: ${context.functional_currency}
- Reporting Period: ${context.reporting_period || "Not specified"}

${referenceSection}

## Rules
1. IPSAS only — never use IFRS or GASB standards
2. ESL-friendly — use plain English, short sentences
3. Cite specific IPSAS paragraphs (e.g., IPSAS 23.45)
4. When multiple treatments are possible, explain why your recommendation fits this entity's context
5. Flag interactions with newer standards (IPSAS 46, 47, 48) when relevant
6. Acknowledge ambiguity when guidance is unclear or when material judgment is required

## Quick Treatment Format (${outputMode})
Provide:
1. Applicable Standards with titles
2. Why This Standard Applies (one paragraph, plain English)
3. Complexity indicator (Straightforward / Moderate / Complex)
4. Recognition criteria (clear decision rules)
5. Measurement guidance (initial and subsequent)
6. Disclosure requirements (key disclosures, references to standard paragraphs)
7. Journal entry (if helpful; use public sector COA structure)
8. Related topics (links to related IPSAS areas)
9. Detailed citations (standard number, paragraph reference, text excerpt)

## Clarifying Questions
If you need more information before providing a complete treatment, ask clarifying questions using the clarifying_questions tool. Provide 2–4 questions as multiple-choice options (ESL-friendly, not free text).

Example dimensions:
- Is this an exchange or non-exchange transaction? (or binding arrangement under IPSAS 47?)
- Is there a condition attached (must be returned if conditions are not met)?
- Has the transaction already occurred or is it prospective?
- Is this for a cash-basis entity or accrual-basis entity?

Always respond using the structured tools provided — never free-text markdown.
`
}
