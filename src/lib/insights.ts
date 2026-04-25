// src/lib/insights.ts
// Source of truth for /insights posts.
// Zero-dep: posts are typed data, rendered via JSX in the route.
// To add a post: append a new entry at the top of POSTS.
//
// Each post's body is an array of "blocks". Each block is one of:
//   - { type: "p", text: string }                — paragraph
//   - { type: "h2" | "h3", text: string }        — heading
//   - { type: "ul", items: string[] }            — bullet list
//   - { type: "quote", text: string, cite?: string } — pull quote
//   - { type: "code", lang?: string, text: string }  — code block
//
// Bodies are deliberately structured (not markdown) so the first post set
// renders cleanly without pulling in a markdown parser dependency. If post
// volume grows past ~20, switch to MDX or remark.

export type InsightBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "code"; lang?: string; text: string }

export type Insight = {
  slug: string
  title: string
  summary: string
  publishedAt: string // ISO date
  readingMinutes: number
  tags: string[]
  body: InsightBlock[]
}

export const INSIGHTS: Insight[] = [
  {
    slug: "ipsas-23-conditional-grants-practitioner-guide",
    title: "IPSAS 23 conditional grants — what ministries get wrong",
    summary:
      "A short guide for public sector accountants recording conditional non-exchange transfers. Covers the condition vs restriction distinction, when a liability must be recognised, and the disclosure requirements most audits flag.",
    publishedAt: "2026-04-25",
    readingMinutes: 6,
    tags: ["IPSAS 23", "Revenue", "Non-exchange transactions"],
    body: [
      {
        type: "p",
        text: "IPSAS 23 governs revenue from non-exchange transactions — taxes, grants, donations, and transfers. For most ministries, the largest risk area is conditional grants from donor agencies. The standard sets a clear test, but the practical application trips up even experienced preparers.",
      },
      { type: "h2", text: "Condition vs restriction" },
      {
        type: "p",
        text: "The single most important distinction in IPSAS 23 is between a condition and a restriction. Both are stipulations attached to a transferred resource, but they have very different accounting consequences.",
      },
      {
        type: "ul",
        items: [
          "Condition: the entity must return the resource (or consume it in a specified way) if the stipulation is not met. A liability is recognised until the condition is fulfilled.",
          "Restriction: the entity must use the resource in a specified manner, but there is no obligation to return it. Revenue is recognised immediately.",
        ],
      },
      {
        type: "p",
        text: "The test is not what the donor intended, it is what the agreement legally requires. If the agreement contains no return obligation, the stipulation is a restriction even if the donor called it a condition in correspondence.",
      },
      { type: "h2", text: "Recognition sequence" },
      {
        type: "ul",
        items: [
          "Receive the resource (cash, asset, or service in-kind).",
          "Classify the transaction — exchange or non-exchange.",
          "If non-exchange with a condition: recognise an asset and a corresponding liability at the same amount.",
          "As the condition is fulfilled (milestone, timeline, or usage), reduce the liability and recognise revenue.",
          "Disclose the unfulfilled balance at each reporting date.",
        ],
      },
      { type: "h2", text: "Measurement" },
      {
        type: "p",
        text: "Measure the asset at fair value at the date of acquisition. For cash this is straightforward. For services in-kind, fair value is the cost the entity would have paid to procure the service — not the donor's internal cost.",
      },
      {
        type: "quote",
        text: "Most audit findings on IPSAS 23 are not about whether revenue was recognised — they are about whether the condition was documented well enough to survive a three-year look-back.",
        cite: "Common finding, Pacific region PEFA reviews",
      },
      { type: "h2", text: "Disclosure — the part audits flag" },
      {
        type: "ul",
        items: [
          "The amount of revenue recognised during the period, disaggregated by major class.",
          "The amount of receivables recognised.",
          "Unfulfilled conditions and other contingencies attaching to resources not yet recognised as revenue.",
          "Assets subject to restrictions on their use.",
        ],
      },
      {
        type: "p",
        text: "The fourth item — restrictions disclosure — is the most commonly missed. If a grant restricts use to a specific programme or time period, that restriction must be disclosed even when the revenue has already been recognised.",
      },
      { type: "h2", text: "IPSAS 47 interaction" },
      {
        type: "p",
        text: "From 1 January 2026, IPSAS 47 introduces the binding arrangement model. Contracts that would previously have been assessed under IPSAS 23 may now fall into scope of IPSAS 47 depending on whether the arrangement is binding and whether the entity has performance obligations. For reporting periods on or after the effective date, preparers should apply the IPSAS 47 scope analysis first, and fall back to IPSAS 23 only for transactions outside its scope.",
      },
      { type: "h2", text: "Practical checklist" },
      {
        type: "ul",
        items: [
          "Identify the resource and the counterparty.",
          "Read the agreement — do not rely on correspondence.",
          "Classify stipulations as conditions or restrictions.",
          "Recognise liability for conditions; recognise revenue for restrictions.",
          "Track condition-satisfaction events through the period.",
          "Disclose unfulfilled conditions and restricted asset use.",
          "Re-assess under IPSAS 47 for periods on or after 1 January 2026.",
        ],
      },
    ],
  },
  {
    slug: "cash-basis-ipsas-gaps-ministries-must-fill",
    title: "Cash Basis IPSAS (C4) — the gaps ministries still have to fill",
    summary:
      "C4 is a single, short standard covering receipts and payments. For ministries on the cash basis, it leaves whole practical topics uncovered — payroll, grants, capital, budget comparison. This post maps each gap to the accrual standard that fills it.",
    publishedAt: "2026-04-20",
    readingMinutes: 5,
    tags: ["Cash Basis", "C4", "IPSAS", "Implementation"],
    body: [
      {
        type: "p",
        text: "Cash Basis IPSAS — the single standard known as C4 — governs how a cash-basis reporter prepares the statement of receipts and payments and the associated disclosures. It is deliberately short. But most public sector transactions are not simple cash in, cash out, and C4 alone does not give a ministry accountant enough guidance to record them consistently.",
      },
      {
        type: "p",
        text: "The practical approach used in Solomon Islands, FSM, and several other Pacific jurisdictions is to apply C4 as the top-level standard and borrow procedures from the accrual IPSAS set for topics C4 does not address.",
      },
      { type: "h2", text: "What C4 covers" },
      {
        type: "ul",
        items: [
          "Statement of cash receipts and payments.",
          "Accounting policies and explanatory notes.",
          "General principles of reporting (fair presentation, going concern, etc.).",
          "Disclosure of third-party settlements and external assistance.",
          "Consolidation requirements for controlled entities (Part 2, voluntary).",
        ],
      },
      { type: "h2", text: "What C4 does not cover" },
      {
        type: "ul",
        items: [
          "Payroll recording and period-end accruals.",
          "Grant and donor fund tracking beyond the cash receipt.",
          "Capital expenditure disclosure beyond the payment.",
          "Budget-to-actual comparison at disaggregated level.",
          "Foreign currency treatment for multi-currency funds.",
          "Segment reporting.",
          "Commitments and contingencies.",
        ],
      },
      { type: "h2", text: "Mapping gaps to accrual standards" },
      {
        type: "p",
        text: "For each gap, the practical fill comes from the accrual standard covering that topic. The ministry records the cash event under C4 and uses the accrual standard for the surrounding disclosure or classification logic.",
      },
      {
        type: "ul",
        items: [
          "Payroll period-end — IPSAS 25/39 principles, adapted to cash disclosure.",
          "Grants received — IPSAS 23 classification, cash recognition under C4.",
          "Capital expenditure — IPSAS 17 categorisation for disclosure only.",
          "Budget comparison — IPSAS 24 disaggregation requirements.",
          "Foreign currency — IPSAS 4 translation principles at payment date.",
          "Segment reporting — IPSAS 18 segment definitions.",
          "Commitments and contingencies — IPSAS 19 disclosure model.",
        ],
      },
      { type: "h2", text: "Why this matters" },
      {
        type: "p",
        text: "A ministry on the cash basis is almost always on a path toward accrual adoption. Applying accrual procedures now — for classification and disclosure only — makes the eventual IPSAS 33 first-time-adoption exercise far less painful. The opening balances are already classified the way the accrual balance sheet will need them.",
      },
    ],
  },
]

export function getInsightBySlug(slug: string): Insight | undefined {
  return INSIGHTS.find((i) => i.slug === slug)
}

export function listInsights(): Insight[] {
  return [...INSIGHTS].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0
  )
}
