// Retrieval layer for the advisor.
//
// Replaces the keyword-match `loadCachedContext` path with real vector
// similarity search backed by Supabase pgvector.
//
// Flow:
//   1. Embed the user's question (HuggingFace API → 384-dim vector)
//   2. Call search_ipsas_chunks RPC (vector similarity + source-tier rerank
//      + effective-date filter)
//   3. Format the top results into a system-prompt-ready context string
//
// Returns null on any embedding/RPC failure so the caller can fall back to
// the legacy keyword cache. Retrieval is best-effort — never block a user
// response on a transient API hiccup.

import { createServiceClient } from "@/lib/supabase/server"
import { embedQuery, EmbeddingError } from "./embeddings"
import { matchedStandards } from "./keyword-boost"

export interface RetrievedChunk {
  id: string
  standard_id: string | null
  source_pdf: string | null
  source_url: string | null
  page_number: number | null
  source_tier: number
  pathway: string | null
  jurisdiction_code: string | null
  text: string
  similarity: number
}

export interface RetrievalResult {
  context: string
  chunks: RetrievedChunk[]
  cacheHit: true
  matchedKeys: string[]
}

interface RetrievalOptions {
  question: string
  reportingBasis?: string
  jurisdiction?: string
  matchCount?: number
}

const TIER_LABEL: Record<number, string> = {
  1: "IPSAS Regulations (highest authority)",
  2: "Downloaded Standards",
  3: "Accounting Study Guides",
  4: "Accounting Guidance",
  5: "Government-Specific",
  6: "Supplementary Resources",
}

/**
 * Run a single vector retrieval pass for a user question.
 * Returns null on any failure — the caller falls back to keyword retrieval.
 */
export async function retrieveChunks(
  options: RetrievalOptions
): Promise<RetrievalResult | null> {
  const { question, reportingBasis, jurisdiction, matchCount = 8 } = options

  if (!question.trim()) return null

  // Step 1 — embed the question
  let embedding: number[]
  try {
    embedding = await embedQuery(question)
  } catch (err) {
    if (err instanceof EmbeddingError) {
      console.warn("retrieveChunks: embedding failed", { message: err.message })
    } else {
      console.warn("retrieveChunks: unexpected embedding error", err)
    }
    return null
  }

  // Step 2 — call the retrieval RPC
  const pathwayFilter =
    reportingBasis === "Cash Basis IPSAS"
      ? "cash-basis"
      : reportingBasis === "Accrual IPSAS"
      ? "accrual"
      : null

  let rpcData: RetrievedChunk[] | null = null
  let serviceClient: Awaited<ReturnType<typeof createServiceClient>>
  try {
    serviceClient = await createServiceClient()
    const { data, error } = await serviceClient.rpc("search_ipsas_chunks", {
      query_embedding: embedding,
      pathway_filter: pathwayFilter,
      jurisdiction_filter: jurisdiction || null,
      exclude_superseded: true,
      match_count: matchCount,
    })
    if (error) {
      console.warn("retrieveChunks: RPC error", error)
      return null
    }
    rpcData = (data ?? []) as RetrievedChunk[]
  } catch (err) {
    console.warn("retrieveChunks: RPC call threw", err)
    return null
  }

  if (!rpcData || rpcData.length === 0) return null

  // Step 2b — keyword boost. If the question contains keywords that map to
  // a known standard, force-include 1 chunk from that standard at the top of
  // the result set. Eval (scripts/eval/run-eval.py) shows this lifts hit rate
  // from 85% to 100% on the golden set.
  const boostStandards = matchedStandards(question)
  if (boostStandards.length > 0) {
    const presentStandards = new Set(
      rpcData.map((c) => c.standard_id).filter((s): s is string => !!s)
    )
    const boostChunks: RetrievedChunk[] = []
    for (const stdId of boostStandards) {
      if (presentStandards.has(stdId)) continue
      try {
        const { data, error } = await serviceClient.rpc(
          "search_ipsas_chunks_by_standard",
          {
            query_embedding: embedding,
            target_standard_id: stdId,
            pathway_filter: pathwayFilter,
            exclude_superseded: true,
            match_count: 1,
          }
        )
        if (error) {
          console.warn("retrieveChunks: boost RPC error", { stdId, error })
          continue
        }
        const list = (data ?? []) as RetrievedChunk[]
        boostChunks.push(...list)
      } catch (err) {
        console.warn("retrieveChunks: boost RPC threw", { stdId, err })
      }
    }

    if (boostChunks.length > 0) {
      const seen = new Set<string>()
      const merged: RetrievedChunk[] = []
      for (const bc of boostChunks) {
        if (seen.has(bc.id)) continue
        merged.push(bc)
        seen.add(bc.id)
      }
      for (const c of rpcData) {
        if (seen.has(c.id)) continue
        merged.push(c)
        seen.add(c.id)
      }
      rpcData = merged.slice(0, matchCount)
    }
  }

  // Step 3 — format the chunks into a system-prompt context block
  // Group by standard_id for readability, but preserve rank order.
  const formatted = rpcData
    .map((chunk, idx) => {
      const tierLabel = TIER_LABEL[chunk.source_tier] ?? `Tier ${chunk.source_tier}`
      const sourceLabel = chunk.standard_id
        ? `${chunk.standard_id}${chunk.page_number ? ` p.${chunk.page_number}` : ""}`
        : chunk.source_pdf || chunk.source_url || "unknown source"
      const confidence = Math.round(chunk.similarity * 100)

      return [
        `[${idx + 1}] Source: ${sourceLabel}  ·  ${tierLabel}  ·  match ${confidence}%`,
        chunk.text.trim(),
      ].join("\n")
    })
    .join("\n\n")

  const context = [
    "## Retrieved IPSAS Reference Material",
    "",
    "The chunks below were retrieved from authoritative IPSAS sources via",
    "vector similarity search. They are ranked by relevance and re-weighted",
    "by source authority (Regulations > Standards > Guidance).",
    "",
    "When answering:",
    "- Prefer higher-tier sources when they conflict with lower-tier sources.",
    "- Cite the specific paragraph from the chunk text — do not invent paragraph numbers.",
    "- If no chunk supports the claim, say 'Citation not found in provided text.'",
    "",
    formatted,
  ].join("\n")

  return {
    context,
    chunks: rpcData,
    cacheHit: true,
    matchedKeys: rpcData.map((c) => c.standard_id || c.id).filter(Boolean) as string[],
  }
}
