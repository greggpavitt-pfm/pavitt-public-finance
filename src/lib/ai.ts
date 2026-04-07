// src/lib/ai.ts
// Provider-agnostic AI client configuration.
// Reads AI_PROVIDER, AI_MODEL, and AI_API_KEY from environment variables.
// Server-side only — never import this in client components.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIProvider = "anthropic" | "openai" | "google"

export interface AIConfig {
  provider: AIProvider
  model: string
  apiKey: string
}

export interface AIMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface AIResponse {
  content: string
  model: string
  tokensUsed?: number
}

// ---------------------------------------------------------------------------
// Config loader
// ---------------------------------------------------------------------------

export function getAIConfig(): AIConfig {
  const provider = process.env.AI_PROVIDER as AIProvider | undefined
  const model = process.env.AI_MODEL
  const apiKey = process.env.AI_API_KEY

  if (!provider || !model || !apiKey) {
    throw new Error(
      "Missing AI configuration. Set AI_PROVIDER, AI_MODEL, and AI_API_KEY " +
        "in your .env.local file. See .env.example for details."
    )
  }

  const validProviders: AIProvider[] = ["anthropic", "openai", "google"]
  if (!validProviders.includes(provider)) {
    throw new Error(
      `Invalid AI_PROVIDER "${provider}". Must be one of: ${validProviders.join(", ")}`
    )
  }

  return { provider, model, apiKey }
}

// ---------------------------------------------------------------------------
// Chat completion — delegates to the correct provider SDK
// ---------------------------------------------------------------------------

export async function chat(
  systemPrompt: string,
  messages: AIMessage[]
): Promise<AIResponse> {
  const config = getAIConfig()

  switch (config.provider) {
    case "anthropic":
      return chatAnthropic(config, systemPrompt, messages)
    case "openai":
      return chatOpenAI(config, systemPrompt, messages)
    case "google":
      return chatGoogle(config, systemPrompt, messages)
  }
}

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------

async function chatAnthropic(
  config: AIConfig,
  systemPrompt: string,
  messages: AIMessage[]
): Promise<AIResponse> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default
  const client = new Anthropic({ apiKey: config.apiKey })

  const response = await client.messages.create({
    model: config.model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  })

  const textBlock = response.content.find((b) => b.type === "text")
  return {
    content: textBlock?.text ?? "",
    model: response.model,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  }
}

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

async function chatOpenAI(
  config: AIConfig,
  systemPrompt: string,
  messages: AIMessage[]
): Promise<AIResponse> {
  const OpenAI = (await import("openai")).default
  const client = new OpenAI({ apiKey: config.apiKey })

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as "system" | "user" | "assistant", content: m.content })),
    ],
  })

  return {
    content: response.choices[0]?.message?.content ?? "",
    model: response.model,
    tokensUsed: response.usage
      ? response.usage.prompt_tokens + response.usage.completion_tokens
      : undefined,
  }
}

// ---------------------------------------------------------------------------
// Google (Gemini)
// ---------------------------------------------------------------------------

async function chatGoogle(
  config: AIConfig,
  systemPrompt: string,
  messages: AIMessage[]
): Promise<AIResponse> {
  const { GoogleGenAI } = await import("@google/genai")
  const client = new GoogleGenAI({ apiKey: config.apiKey })

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const response = await client.models.generateContent({
    model: config.model,
    config: { systemInstruction: systemPrompt },
    contents,
  })

  return {
    content: response.text ?? "",
    model: config.model,
    tokensUsed: response.usageMetadata
      ? (response.usageMetadata.promptTokenCount ?? 0) +
        (response.usageMetadata.candidatesTokenCount ?? 0)
      : undefined,
  }
}
