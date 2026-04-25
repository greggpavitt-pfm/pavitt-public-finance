// Keyword-driven retrieval boost.
//
// Vector similarity alone misses standards whose names don't appear in chunk
// text but are clearly the right answer for a question. Example: a query
// about "foreign currency at year-end" embeds closer to IPSAS 41 (financial
// instruments) than IPSAS 4 (foreign currency translation) because IPSAS 41
// has more text and overlapping vocabulary.
//
// We fix this by maintaining a curated keyword -> standard_id map. When a
// question contains any keyword for a standard, we fetch that standard's
// top-N chunks (by similarity to the same query) and merge them into the
// vector result set.
//
// Curated by query failure analysis on the eval golden set. Add new entries
// when a real query reveals a known standard isn't surfacing.

export interface KeywordBoostRule {
  standard_id: string
  // All keywords listed here trigger the boost. Match is case-insensitive
  // substring on the question text (no NLP — keep it cheap).
  keywords: readonly string[]
}

export const KEYWORD_BOOST_RULES: readonly KeywordBoostRule[] = [
  // IPSAS 1 - Presentation of Financial Statements
  {
    standard_id: "IPSAS-1",
    keywords: [
      "primary financial statements",
      "four financial statements",
      "four primary",
      "complete set of financial statements",
      "what statements must",
      "financial statements must prepare",
      "presentation of financial statements",
    ],
  },
  // IPSAS 4 - Effects of Changes in Foreign Exchange Rates
  {
    standard_id: "IPSAS-4",
    keywords: [
      "foreign currency",
      "exchange rate",
      "foreign exchange",
      "year-end rate",
      "year end rate",
      "currency translation",
      "functional currency",
      "presentation currency",
      "usd-denominated",
      "usd denominated",
      "multi-currency",
      "multi currency",
    ],
  },
  // IPSAS 23 - Revenue from Non-Exchange Transactions
  {
    standard_id: "IPSAS-23",
    keywords: [
      "non-exchange",
      "non exchange",
      "donor grant",
      "donor agency",
      "ausaid",
      "world bank grant",
      "conditional grant",
      "tied grant",
      "transfer received",
      "in-kind donation",
      "in kind donation",
    ],
  },
]

/**
 * Match a user question against the keyword boost rules.
 * Returns the deduplicated list of standard_ids that should be force-included
 * in retrieval (each is then resolved to chunks by the caller).
 */
export function matchedStandards(question: string): string[] {
  const q = question.toLowerCase()
  const hits = new Set<string>()
  for (const rule of KEYWORD_BOOST_RULES) {
    for (const kw of rule.keywords) {
      if (q.includes(kw)) {
        hits.add(rule.standard_id)
        break
      }
    }
  }
  return Array.from(hits)
}
