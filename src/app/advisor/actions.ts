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

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { readFileSync } from "fs"
import { join } from "path"

// ---------------------------------------------------------------------------
// Type definitions (structured output from LLM tool-use)
// ---------------------------------------------------------------------------

export interface Citation {
  standard: string
  paragraph: string
  text: string
}

export interface QuickTreatmentResponse {
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

export interface ClarifyingQuestionsResponse {
  needs_clarification: true
  questions: Array<{
    id: string
    text: string
    options: string[]
  }>
}

export type IPSASResponse = QuickTreatmentResponse | ClarifyingQuestionsResponse

// ---------------------------------------------------------------------------
// Helper: Get model ID for a task type from advisor_model_config
// Falls back to hardcoded defaults if the table is unavailable
// ---------------------------------------------------------------------------

const MODEL_DEFAULTS: Record<string, string> = {
  logic_and_drafting:    "deepseek/deepseek-r1",
  citation_verification: "google/gemini-1.5-flash",
  summary_for_office:    "openai/gpt-5-nano",
}

async function getModelForTask(taskType: string): Promise<string> {
  try {
    const serviceClient = await createServiceClient()
    const { data } = await serviceClient
      .from("advisor_model_config")
      .select("model_id")
      .eq("task_type", taskType)
      .single()
    return data?.model_id ?? MODEL_DEFAULTS[taskType] ?? "deepseek/deepseek-r1"
  } catch {
    return MODEL_DEFAULTS[taskType] ?? "deepseek/deepseek-r1"
  }
}

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
// Queries advisor_usage_log (the denormalised usage table) for today's token
// total for this specific user. dailyCap comes from profiles.daily_token_limit
// so it can be configured per-user without a code deploy.

async function checkTokenLimit(
  userId: string,
  dailyCap: number,
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>
): Promise<{ allowed: boolean; reason?: string }> {
  // Get today's date boundary in UTC
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Sum tokens used by this user today from the usage log.
  // advisor_usage_log has user_id directly, so no join is needed.
  const { data: todaysUsage } = await serviceClient
    .from("advisor_usage_log")
    .select("total_tokens")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())

  const tokensUsedToday = (todaysUsage ?? []).reduce(
    (sum, row) => sum + (row.total_tokens || 0),
    0
  )

  if (tokensUsedToday >= dailyCap) {
    return {
      allowed: false,
      reason: `Daily token limit reached (${tokensUsedToday.toLocaleString()}/${dailyCap.toLocaleString()}). Resets at midnight UTC.`,
    }
  }

  return { allowed: true }
}

// ---------------------------------------------------------------------------
// Helper: Load pre-computed RAG context from Supabase cache
// ---------------------------------------------------------------------------
// Tries to find relevant cached knowledge packets for the user's question.
// Each packet contains pre-retrieved ChromaDB chunks for a specific IPSAS
// standard or topic cluster, stored in the rag_knowledge_cache table.
//
// Matching: simple keyword overlap + bonus for explicit standard ID mentions
// (e.g. user types "IPSAS 23"). This is fast, transparent, and easy to debug
// — no vector embeddings needed for ~80 entries.
//
// Returns:
//   context    — formatted text ready to inject into the system prompt, or null
//   cacheHit   — false means fall back to loadReferenceContent()
//   matchedKeys — which cache entries were used (stored in advisor_messages)

async function loadCachedContext(
  userQuestion: string,
  reportingBasis: string,
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>
): Promise<{ context: string | null; cacheHit: boolean; matchedKeys: string[] }> {
  try {
    const questionLower = userQuestion.toLowerCase()

    // Map reporting basis to the pathway value stored in the cache table
    const pathwayFilter = reportingBasis === "Cash Basis IPSAS" ? "cash-basis" : "accrual"

    // Load all cache entry metadata for this pathway.
    // We load only the lightweight columns (no raw_chunks yet) because
    // we want to score all ~80 entries before deciding which chunks to fetch.
    const { data: allEntries, error } = await serviceClient
      .from("rag_knowledge_cache")
      .select("cache_key, label, standard_ids, keywords, pathway, standard_status")
      .in("pathway", [pathwayFilter, "both"])
      .eq("standard_status", "current")

    if (error || !allEntries || allEntries.length === 0) {
      // Cache not yet populated or unavailable — caller will use static files
      if (error) console.warn("loadCachedContext: DB error", { error })
      return { context: null, cacheHit: false, matchedKeys: [] }
    }

    // Score each entry by how well it matches the user's question.
    // +10 if user explicitly mentioned the standard ID (e.g. "IPSAS 23", "IPSAS-23")
    // +2  for each keyword that appears in the question text
    const scored = allEntries.map((entry) => {
      let score = 0

      for (const stdId of (entry.standard_ids as string[])) {
        // Match "IPSAS 23", "IPSAS-23", "ipsas23", "IPSAS23.7" etc.
        const pattern = stdId.replace("-", "[ -]?").toLowerCase()
        if (new RegExp(pattern).test(questionLower)) {
          score += 10
        }
      }

      for (const keyword of (entry.keywords as string[])) {
        if (questionLower.includes(keyword.toLowerCase())) {
          score += 2
        }
      }

      return { ...entry, score }
    })

    // Take the top 3 matches (cap at 3 to keep prompt size manageable:
    // 3 entries × 12 chunks × ~900 chars ≈ ~10,000 tokens of context)
    const topMatches = scored
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    if (topMatches.length === 0) {
      // No keyword match — caller falls back to static reference files
      return { context: null, cacheHit: false, matchedKeys: [] }
    }

    // Now fetch the full raw_chunks data only for the matched entries.
    // (raw_chunks is a large JSONB column — only load it when needed.)
    const matchedKeys = topMatches.map((e) => e.cache_key as string)
    const { data: fullEntries, error: fetchError } = await serviceClient
      .from("rag_knowledge_cache")
      .select("cache_key, label, raw_chunks, synthesised_summary")
      .in("cache_key", matchedKeys)

    if (fetchError || !fullEntries) {
      console.warn("loadCachedContext: failed to fetch chunk data", { fetchError })
      return { context: null, cacheHit: false, matchedKeys: [] }
    }

    // Build the context string to inject into the system prompt.
    // Prefer synthesised_summary if available (compact, ~400-word LLM overview).
    // Fall back to raw chunks (verbatim IPSAS source text, up to 12 chunks).
    const contextBlocks = fullEntries.map((entry) => {
      if (entry.synthesised_summary) {
        return `### ${entry.label}\n\n${entry.synthesised_summary}`
      }

      const chunks = entry.raw_chunks as Array<{ text: string; source: string; score: number }>
      const chunkText = chunks
        .slice(0, 12) // Limit to 12 chunks per entry to control prompt token count
        .map((c, i) => `[${i + 1}] Source: ${c.source} (relevance: ${Math.round(c.score * 100)}%)\n${c.text}`)
        .join("\n\n")

      return `### ${entry.label}\n\n${chunkText}`
    })

    const context = [
      "## Pre-Retrieved IPSAS Knowledge Base",
      "The following content was retrieved from IPSAS source documents based on the user's question.",
      "Use this as your primary reference. Cite specific paragraphs where identifiable.",
      "",
      ...contextBlocks,
    ].join("\n\n")

    return { context, cacheHit: true, matchedKeys }
  } catch (err) {
    // Any error falls back gracefully — the cache is a performance enhancement,
    // not a hard requirement. The LLM can still answer using static reference files.
    console.warn("loadCachedContext: unexpected error, falling back to static files", { err })
    return { context: null, cacheHit: false, matchedKeys: [] }
  }
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

  // Fetch profile to get org/subgroup for the usage log and the per-user daily cap.
  // Falls back to the platform default (100,000) if the profile row is missing.
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("org_id, subgroup_id, daily_token_limit")
    .eq("id", user.id)
    .single()
  const dailyCap: number = profile?.daily_token_limit ?? 100000

  // Check token limit using the configurable cap
  const tokenCheck = await checkTokenLimit(user.id, dailyCap, serviceClient)
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

  // Try the pre-computed RAG cache first; fall back to static reference files if no match.
  // The cache holds pre-retrieved ChromaDB chunks for each IPSAS standard and topic cluster.
  // A cache hit replaces the live ChromaDB search — one fast Supabase read instead.
  const { context: cachedContext, cacheHit, matchedKeys } = await loadCachedContext(
    userMessage,
    context.reporting_basis,
    serviceClient
  )
  console.log(`sendMessage: context cache ${cacheHit ? "HIT" : "MISS"}`, {
    conversationId,
    matchedKeys,
  })

  // If the cache returned context, use it; otherwise fall back to static reference files
  const referenceContent = cachedContext ?? loadReferenceContent()

  // Store which cache keys were used — shown in advisor_messages.topics_matched column.
  // 'live-search-fallback' means no cache match was found for this question.
  const topicsMatched = cacheHit ? matchedKeys : ["live-search-fallback"]

  const systemPrompt = buildSystemPrompt(context, conversation.output_mode, referenceContent)

  // Look up which model to use for logic & drafting (admin-configurable)
  const modelId = await getModelForTask("logic_and_drafting")

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error("sendMessage: OPENROUTER_API_KEY not set")
    return { messageId: null, error: "API key not configured" }
  }

  try {
    // Call OpenRouter using the OpenAI-compatible API format
    const httpResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter uses these headers to attribute usage in their dashboard
        "HTTP-Referer": "https://pfmexpert.net",
        "X-Title": "IPSAS Advisor",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 2048,
        // Enable OpenRouter response caching to reduce cost on repeated queries
        plugins: { caching: true },
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: userMessage },
        ],
        // OpenAI-compatible tool use (function calling)
        tools: [
          {
            type: "function",
            function: {
              name: "ipsas_response",
              description: "Structured IPSAS treatment response",
              parameters: {
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
          },
          {
            type: "function",
            function: {
              name: "clarifying_questions",
              description: "Questions to clarify the user's situation before providing treatment",
              parameters: {
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
          },
        ],
        // Force the model to always call one of the tools (no free-text fallback)
        tool_choice: "required",
      }),
    })

    if (!httpResponse.ok) {
      const errorText = await httpResponse.text()
      console.error("sendMessage: OpenRouter API error", { status: httpResponse.status, errorText })
      return { messageId: null, error: `LLM API error: ${httpResponse.status}` }
    }

    const data = await httpResponse.json()

    // Parse OpenAI-format response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
    if (!toolCall) {
      console.error("sendMessage: no tool call in response", { conversationId, data })
      return { messageId: null, error: "Invalid LLM response" }
    }

    const toolUsed = toolCall.function.name as "ipsas_response" | "clarifying_questions"
    // arguments is a JSON string in OpenAI format
    const structuredOutput: IPSASResponse = JSON.parse(toolCall.function.arguments)

    const usage = data.usage ?? {}

    // Handle clarifying questions flow
    if (toolUsed === "clarifying_questions") {
      const clarQ = structuredOutput as ClarifyingQuestionsResponse

      const { data: assistantMsg, error: assistantError } = await serviceClient
        .from("advisor_messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: "I need to understand your situation better before providing a complete treatment.",
          clarifying_questions: clarQ.questions,
          topics_matched: topicsMatched,
        })
        .select("id")
        .single()

      if (assistantError || !assistantMsg) {
        console.error("sendMessage: failed to save clarifying questions", { conversationId, error: assistantError })
        return { messageId: null, error: "Failed to save response" }
      }

      // Write usage log entry (best-effort — failure here does not fail the request)
      const clarifyTotalTokens = (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0)
      serviceClient
        .from("advisor_usage_log")
        .insert({
          user_id: user.id,
          org_id: profile?.org_id ?? null,
          subgroup_id: profile?.subgroup_id ?? null,
          conversation_id: conversationId,
          message_id: assistantMsg.id,
          model_used: modelId,
          task_type: "logic_and_drafting",
          prompt_tokens: usage.prompt_tokens ?? 0,
          completion_tokens: usage.completion_tokens ?? 0,
          total_tokens: clarifyTotalTokens,
        })
        .then(({ error: logError }) => {
          if (logError) console.warn("sendMessage: usage log write failed (clarifying)", { logError })
        })

      return {
        messageId: assistantMsg.id,
        assistantMessage: "I need to understand your situation better before providing a complete treatment.",
        clarifyingQuestions: clarQ.questions,
      }
    }

    // Handle full treatment (ipsas_response)
    if (toolUsed === "ipsas_response") {
      const treatment = structuredOutput as QuickTreatmentResponse

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

      // OpenRouter uses OpenAI token field names (prompt_tokens / completion_tokens)
      const { data: assistantMsg, error: assistantError } = await serviceClient
        .from("advisor_messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: responseContent,
          citations: treatment.citations,
          topics_matched: topicsMatched,
          standards_cited: treatment.applicable_standards.map((s) => s.standard_id),
          complexity: treatment.complexity,
          token_count_in: usage.prompt_tokens ?? 0,
          token_count_out: usage.completion_tokens ?? 0,
        })
        .select("id")
        .single()

      if (assistantError || !assistantMsg) {
        console.error("sendMessage: failed to save treatment", { conversationId, error: assistantError })
        return { messageId: null, error: "Failed to save response" }
      }

      // Auto-update conversation title from first message
      if (conversation.title === "New Conversation") {
        const titleSummary = userMessage.substring(0, 60).replace(/\n/g, " ")
        await serviceClient
          .from("advisor_conversations")
          .update({ title: titleSummary })
          .eq("id", conversationId)
      }

      // Write usage log entry (best-effort — failure here does not fail the request)
      const treatmentTotalTokens = (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0)
      serviceClient
        .from("advisor_usage_log")
        .insert({
          user_id: user.id,
          org_id: profile?.org_id ?? null,
          subgroup_id: profile?.subgroup_id ?? null,
          conversation_id: conversationId,
          message_id: assistantMsg.id,
          model_used: modelId,
          task_type: "logic_and_drafting",
          prompt_tokens: usage.prompt_tokens ?? 0,
          completion_tokens: usage.completion_tokens ?? 0,
          total_tokens: treatmentTotalTokens,
        })
        .then(({ error: logError }) => {
          if (logError) console.warn("sendMessage: usage log write failed (treatment)", { logError })
        })

      return {
        messageId: assistantMsg.id,
        assistantMessage: responseContent,
        citations: treatment.citations,
        complexity: treatment.complexity,
      }
    }

    return { messageId: null, error: "Unexpected response format" }
  } catch (err) {
    console.error("sendMessage: OpenRouter API error", { conversationId, error: err })
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
  // Reference content may be either:
  //   (a) Pre-computed cached chunks — already structured as markdown with headers
  //   (b) Static curated reference file — raw text loaded from disk
  // Both are injected directly; no code-fence wrapper so markdown renders correctly.
  const referenceSection = referenceContent
    ? `## Reference Knowledge Base

Below is IPSAS reference material retrieved for this question. Use this as your authoritative source for citations and guidance.

${referenceContent}

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
