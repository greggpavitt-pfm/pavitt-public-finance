// Embedding helper for the advisor RAG retrieval layer.
//
// Uses OpenAI text-embedding-3-small (1536-dim) to match the embeddings in
// the ipsas_chunks table. Both the bulk migration script and this query path
// must use the same model — switching models requires re-embedding the
// entire corpus.
//
// Server-side only — OPENAI_API_KEY must never reach the browser.
//
// If the API call fails (rate-limit, 5xx, network), the caller should fall
// back gracefully to the keyword-match path (loadCachedContext).

const OPENAI_URL = "https://api.openai.com/v1/embeddings"
const EMBEDDING_MODEL = "text-embedding-3-small"
const EMBEDDING_DIM = 1536

export class EmbeddingError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = "EmbeddingError"
  }
}

/**
 * Embed a single text into a 1536-dim vector.
 * Throws EmbeddingError on any failure — caller decides whether to fall back.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new EmbeddingError("OPENAI_API_KEY is not set")
  }

  // Model context is 8191 tokens (~32k chars). Clip well within for speed/cost.
  const cleaned = text.trim().slice(0, 8000)
  if (!cleaned) {
    throw new EmbeddingError("Cannot embed empty text")
  }

  let response: Response
  try {
    response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: cleaned,
        // OpenAI default is 1536 for text-embedding-3-small. Pinning explicitly
        // protects against future API default drift.
        dimensions: EMBEDDING_DIM,
      }),
    })
  } catch (err) {
    throw new EmbeddingError("Network error reaching OpenAI", err)
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new EmbeddingError(
      `OpenAI returned ${response.status}: ${body.slice(0, 200)}`
    )
  }

  let data: { data?: Array<{ embedding?: number[] }> }
  try {
    data = await response.json()
  } catch (err) {
    throw new EmbeddingError("OpenAI returned non-JSON response", err)
  }

  const vector = data.data?.[0]?.embedding
  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIM) {
    throw new EmbeddingError(
      `Unexpected embedding shape: got length ${Array.isArray(vector) ? vector.length : "non-array"}, expected ${EMBEDDING_DIM}`
    )
  }

  return vector
}

export const EMBEDDING_DIMENSIONS = EMBEDDING_DIM
export const EMBEDDING_MODEL_NAME = EMBEDDING_MODEL
