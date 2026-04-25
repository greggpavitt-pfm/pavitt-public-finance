// Citation verification helper for the advisor.
//
// Given a citation (standard_id + paragraph) and the assistant's claim text,
// fetch the actual chunk text from ipsas_chunks and ask the verification LLM
// (Gemini 1.5 Flash by default) whether the source supports the claim.
//
// Used by the interactive footnote UI: hover → calls this → returns
// { confidence, snippet, supports }.
//
// Important: verification queries the ACTUAL stored chunk text — not the
// drafting context. This breaks the circular "verify against the same source
// that generated the answer" problem.

import { createServiceClient } from "@/lib/supabase/server"

export interface CitationVerification {
  supports: "yes" | "partial" | "no"
  confidence: number // 0-1
  snippet: string // 3-sentence excerpt from source
  source: {
    standard_id: string | null
    page_number: number | null
    source_pdf: string | null
  }
  error?: string
}

interface VerifyOptions {
  standardId: string
  paragraph?: string
  claim: string
}

const SYSTEM_PROMPT = `You are a citation verifier for IPSAS standards. Given:
- a CLAIM made by another model
- a SOURCE TEXT extracted from an IPSAS standard

Decide whether the source text supports the claim. Reply with strict JSON:
{
  "supports": "yes" | "partial" | "no",
  "confidence": 0.0-1.0,
  "snippet": "<at most 3 sentences quoted verbatim from the source that bear on the claim>"
}

Rules:
- "yes" — the source plainly states the claim or a direct equivalent.
- "partial" — the source touches the topic but does not fully support the wording of the claim.
- "no" — the source does not address the claim, or contradicts it.
- Quote the snippet exactly. Do not paraphrase.
- Confidence reflects your certainty in the verdict, not the strength of the claim itself.`

async function getModelForTask(taskType: string, fallback: string): Promise<string> {
  try {
    const serviceClient = await createServiceClient()
    const { data } = await serviceClient
      .from("advisor_model_config")
      .select("model_id")
      .eq("task_type", taskType)
      .single()
    return data?.model_id ?? fallback
  } catch {
    return fallback
  }
}

/**
 * Find the most relevant chunk for a citation. Tries paragraph-level match
 * first, falls back to standard-level match, returns null if nothing found.
 */
async function findSourceChunk(
  standardId: string,
  paragraph?: string
): Promise<{ text: string; standard_id: string | null; page_number: number | null; source_pdf: string | null } | null> {
  const serviceClient = await createServiceClient()

  // Normalise: 'IPSAS 23' → 'IPSAS-23'
  const normalised = standardId.toUpperCase().replace(/\s+/g, "-")

  // Try a tier-1 source first (Regulations), then any tier
  for (const tierFilter of [[1], [1, 2], [1, 2, 3, 4, 5, 6]]) {
    let q = serviceClient
      .from("ipsas_chunks")
      .select("text, standard_id, page_number, source_pdf")
      .eq("standard_id", normalised)
      .in("source_tier", tierFilter)
      .order("source_tier", { ascending: true })

    // If a paragraph hint exists, prefer chunks that contain it in the text
    if (paragraph) {
      q = q.ilike("text", `%${paragraph}%`)
    }

    const { data } = await q.limit(1)
    if (data && data.length > 0) {
      return data[0]
    }
  }

  return null
}

export async function verifyCitation(
  options: VerifyOptions
): Promise<CitationVerification> {
  const { standardId, paragraph, claim } = options

  const empty: CitationVerification = {
    supports: "no",
    confidence: 0,
    snippet: "",
    source: { standard_id: standardId, page_number: null, source_pdf: null },
  }

  if (!standardId || !claim.trim()) {
    return { ...empty, error: "Missing standardId or claim" }
  }

  const chunk = await findSourceChunk(standardId, paragraph)
  if (!chunk) {
    return {
      ...empty,
      error: "Source chunk not found in knowledge base",
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return { ...empty, error: "OPENROUTER_API_KEY not set" }
  }

  const model = await getModelForTask("citation_verification", "google/gemini-1.5-flash")

  let response: Response
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        plugins: [{ id: "caching" }],
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `CLAIM:\n${claim.trim()}\n\nSOURCE TEXT (${chunk.standard_id}${chunk.page_number ? ` p.${chunk.page_number}` : ""}):\n${chunk.text}\n\nReturn JSON only.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    })
  } catch (err) {
    return {
      ...empty,
      source: {
        standard_id: chunk.standard_id,
        page_number: chunk.page_number,
        source_pdf: chunk.source_pdf,
      },
      error: `Verifier network error: ${(err as Error).message}`,
    }
  }

  if (!response.ok) {
    return {
      ...empty,
      source: {
        standard_id: chunk.standard_id,
        page_number: chunk.page_number,
        source_pdf: chunk.source_pdf,
      },
      error: `Verifier returned ${response.status}`,
    }
  }

  let parsed: { supports?: string; confidence?: number; snippet?: string } = {}
  try {
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? "{}"
    parsed = typeof content === "string" ? JSON.parse(content) : content
  } catch {
    return {
      ...empty,
      source: {
        standard_id: chunk.standard_id,
        page_number: chunk.page_number,
        source_pdf: chunk.source_pdf,
      },
      error: "Verifier returned malformed JSON",
    }
  }

  const supports =
    parsed.supports === "yes" || parsed.supports === "partial" || parsed.supports === "no"
      ? parsed.supports
      : "no"
  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0))
  const snippet = (parsed.snippet || "").trim().slice(0, 600)

  return {
    supports,
    confidence,
    snippet,
    source: {
      standard_id: chunk.standard_id,
      page_number: chunk.page_number,
      source_pdf: chunk.source_pdf,
    },
  }
}
