// /products — public landing page for the PFS SaaS products.
// Two products: IPSAS Training (self-paced modules + grading) and
// IPSAS Advisor (practitioner Q&A with citations).
// Target audience: Ministry of Finance procurement + training officers.

import type { Metadata } from "next"
import Link from "next/link"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"

export const metadata: Metadata = {
  title: "Products — IPSAS Training and Practitioner Advisor",
  description:
    "Software products for public sector accounting teams: self-paced IPSAS training modules with organisational reporting, plus a practitioner advisor that answers real IPSAS questions with cited paragraphs.",
  alternates: { canonical: "/products" },
}

type Product = {
  id: string
  name: string
  kicker: string
  tagline: string
  summary: string
  features: string[]
  pricing: {
    tier: string
    headline: string
    detail: string
  }[]
  cta: { label: string; href: string }
}

const PRODUCTS: Product[] = [
  {
    id: "training",
    name: "IPSAS Training",
    kicker: "Product 01",
    tagline: "Self-paced IPSAS training for ministry finance staff.",
    summary:
      "Over 100 modules across accrual and cash-basis IPSAS, jurisdiction overlays for country-specific rules, per-user grading with a 70% pass mark, and org-level reporting for training managers.",
    features: [
      "110+ modules across accrual, cash-basis, and shared content",
      "Three difficulty levels for accrual learners",
      "Solomon Islands jurisdiction overlay (more jurisdictions on request)",
      "Per-product approval — admins control training access per user",
      "Reviewer role — two reviewers per org with scoped result access",
      "Usage caps with inheritance (user → subgroup → org → unlimited)",
      "Auto-submit after 24 hours to keep records clean",
      "Certificate on 70% pass, with verifiable URL",
    ],
    pricing: [
      {
        tier: "Beta",
        headline: "Free for pilot orgs",
        detail: "3-month pilot with full feature access. Contact for licence key.",
      },
      {
        tier: "Standard",
        headline: "Per-seat, per-year",
        detail: "Org licence with configurable seat limits and subgroup structure.",
      },
      {
        tier: "Enterprise",
        headline: "Custom",
        detail: "Custom jurisdiction overlay, content co-authoring, onboarding support.",
      },
    ],
    cta: { label: "Request a licence", href: "/#contact" },
  },
  {
    id: "advisor",
    name: "IPSAS Practitioner Advisor",
    kicker: "Product 02",
    tagline: "Describe a transaction. Get a cited IPSAS treatment.",
    summary:
      "Interactive Q&A for working accountants. The advisor identifies applicable standards, asks clarifying questions when needed, and returns recognition, measurement, and disclosure guidance with paragraph-level citations.",
    features: [
      "Natural-language input — no need to know which standard applies",
      "Context-aware — jurisdiction, entity type, reporting basis locked per conversation",
      "Citations to specific IPSAS paragraphs",
      "Clarifying-question flow for ESL users (clickable options)",
      "PDF attachments up to 4MB for transaction documents",
      "Conversation history saved for audit reference",
      "Daily + rolling 7-day token caps (cost controlled)",
      "Admin-configurable LLM routing via OpenRouter",
    ],
    pricing: [
      {
        tier: "Beta",
        headline: "Included with Training licence",
        detail: "Practitioner access granted per-user by org admin during pilot.",
      },
      {
        tier: "Standard",
        headline: "Per-user, per-month",
        detail: "Usage caps configurable at org, subgroup, or user level.",
      },
      {
        tier: "Enterprise",
        headline: "Custom",
        detail: "Jurisdiction-specific knowledge base extension, SLA, dedicated support.",
      },
    ],
    cta: { label: "Request access", href: "/#contact" },
  },
]

export default function ProductsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* Hero */}
        <section className="border-b border-ink-200 bg-ppf-navy px-6 pt-[140px] pb-16 text-white md:px-12 md:pt-[160px] md:pb-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow text-white/60">Products</p>
            <h1 className="mt-3 max-w-[22ch] text-[clamp(32px,4.2vw,56px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              The same IPSAS systems Gregg uses — available to your ministry.
            </h1>
            <p className="mt-5 max-w-[60ch] text-[17px] leading-[1.6] text-white/80">
              Two web-based products built for public sector finance teams in
              developing countries. Low-bandwidth friendly, ESL-aware, and
              licensed by organisation.
            </p>
          </div>
        </section>

        {/* Products */}
        <div className="mx-auto max-w-[1240px] px-6 py-16 md:px-12 md:py-24">
          {PRODUCTS.map((p, idx) => (
            <section
              key={p.id}
              id={p.id}
              className={[
                "grid gap-10 md:grid-cols-[1fr_1.1fr] md:gap-16",
                idx > 0 ? "mt-20 border-t border-ink-200 pt-16 md:mt-28 md:pt-24" : "",
              ].join(" ")}
            >
              {/* Left — name + summary + CTA */}
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ppf-sky">
                  {p.kicker}
                </p>
                <h2 className="mt-3 text-[clamp(26px,2.8vw,36px)] font-semibold leading-[1.15] tracking-[-0.02em] text-ink-900">
                  {p.name}
                </h2>
                <p className="mt-3 text-lg font-medium text-ppf-blue">
                  {p.tagline}
                </p>
                <p className="mt-4 text-[15px] leading-[1.65] text-ink-700">
                  {p.summary}
                </p>
                <Link
                  href={p.cta.href}
                  className="mt-8 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-4 py-2.5 text-sm font-medium text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
                >
                  {p.cta.label}
                  <span aria-hidden>→</span>
                </Link>
              </div>

              {/* Right — features + pricing */}
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                  What is included
                </h3>
                <ul className="mt-3 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-[14px] leading-[1.55] text-ink-800">
                      <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ppf-sky" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="mt-8 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                  Licensing
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {p.pricing.map((tier) => (
                    <div
                      key={tier.tier}
                      className="rounded-lg border border-ink-200 bg-ink-50 p-4"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ppf-blue">
                        {tier.tier}
                      </div>
                      <div className="mt-1 text-[15px] font-semibold text-ink-900">
                        {tier.headline}
                      </div>
                      <div className="mt-1.5 text-[12px] leading-[1.5] text-ink-600">
                        {tier.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* FAQ / bottom strip */}
        <section className="border-t border-ink-200 bg-ink-50 px-6 py-16 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.02em] text-ink-900">
              Common questions
            </h2>
            <dl className="mt-8 divide-y divide-ink-200">
              {[
                {
                  q: "Who is this for?",
                  a: "Ministries of Finance, national treasuries, and audit offices adopting or already using IPSAS. Jurisdiction overlays available for Solomon Islands; others on request.",
                },
                {
                  q: "How is user data protected?",
                  a: "Row-level security on every table. Org admins see only their org. Correct answers are never returned to the browser — answer-checking runs server-side with a service role key.",
                },
                {
                  q: "Does the advisor hallucinate citations?",
                  a: "The advisor cites only paragraphs retrieved from the IPSAS knowledge base. Citations can be hovered to see the source text. If no paragraph is found, the advisor is instructed to say so rather than guess.",
                },
                {
                  q: "What LLM does the advisor use?",
                  a: "Routed via OpenRouter: DeepSeek R1 for primary reasoning, Gemini 1.5 Flash for citation verification, GPT-5-nano for summaries. Admins can change the model per task.",
                },
                {
                  q: "Is my org's data used to train any model?",
                  a: "No. Conversations are stored in your org's Supabase tables only. No data leaves the hosting infrastructure for model training.",
                },
              ].map((item) => (
                <div key={item.q} className="py-5">
                  <dt className="text-[15px] font-semibold text-ink-900">
                    {item.q}
                  </dt>
                  <dd className="mt-1.5 text-[14px] leading-[1.6] text-ink-700">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-col items-center gap-3 rounded-lg border border-ppf-sky/30 bg-white px-6 py-8 text-center">
              <p className="eyebrow">Next step</p>
              <h3 className="text-[clamp(20px,2vw,26px)] font-semibold tracking-[-0.02em] text-ink-900">
                Pilot programme is open.
              </h3>
              <p className="max-w-[52ch] text-[14px] leading-[1.6] text-ink-700">
                Eligible ministries get a 3-month pilot with full access to both
                products. Send a brief and Gregg will respond within two working days.
              </p>
              <Link
                href="/#contact"
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-5 py-2.5 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
              >
                Start a conversation
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
