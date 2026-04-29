// /drills — IPSAS Drills product page.
// Replaces /ipsas-training (which now 301-redirects here via next.config.ts).
// Copy is taken verbatim from Redesigned-Pages/claude-code-brief.md (Step 2).
// Design language matches /products and the rest of the marketing site:
//   ppf-navy hero, ink-200 bordered cards, eyebrow/H1 typography, max-w-[1240px].

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { donors } from "@/lib/content"

export const metadata: Metadata = {
  title: "IPSAS Drills — Pavitt Public Finance",
  description:
    "Field-tested IPSAS practice for government finance teams and audit firms. Built by a current Pacific Treasury implementation lead, not from a textbook. Free trial.",
  alternates: { canonical: "/drills" },
}

const PAIN_POINTS = [
  {
    title: "Opening balances and transition",
    body: "The unglamorous work that derails most IPSAS adoptions. First-time recognition of assets and liabilities. Restating prior-year comparatives. Opening balance sheet construction when source data is patchy.",
  },
  {
    title: "Revenue, grants, and donor funds",
    body: "Where small governments live or die. IPSAS 23 (non-exchange revenue) at the level you'll actually apply it. Grant conditions, restrictions, and timing. Consolidating donor-funded special purpose funds into the whole-of-government accounts.",
  },
  {
    title: "Reporting and consolidation",
    body: "What auditors actually look at. Whole-of-government consolidation under IPSAS 35. GFS-to-IPSAS mapping. Cash-flow statement construction in environments where the IFMIS doesn't help. Disclosure quality.",
  },
]

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Pick your level",
    body: "Tell us your role and what you're working on. We'll start you with drills appropriate to your situation, not generic exam prep.",
  },
  {
    step: "2",
    title: "Drill, daily",
    body: "Ten to fifteen minutes per session. Each question gives you the answer, the standard, the paragraph, and — where it matters — the implementation note from real projects.",
  },
  {
    step: "3",
    title: "Track the team",
    body: "Solo users see their own progress. Team and ministry plans give the lead accountant a dashboard: who's drilling, where the team is weakest, and what to focus on next.",
  },
]

const AUDIENCE_CARDS = [
  {
    title: "Government finance teams",
    body: "For Ministries, line ministries, and statutory bodies adopting or applying IPSAS. Especially useful where the team is small, capacity is stretched, and external training is hard to access.",
  },
  {
    title: "Audit firms with public-sector clients",
    body: "For small and mid-size firms where government audit isn't the firm's main practice. Bring your team's IPSAS knowledge up to a level where you can confidently sign the opinion.",
  },
  {
    title: "PFM consultants and donor-project staff",
    body: "For staff supporting government counterparts on IPSAS reform. Use Drills yourself; deploy it to the teams you're supporting.",
  },
]

const FAQ = [
  {
    q: "Do I get a certificate?",
    a: "Drills isn't a certificate program — that's CIPFA and ACCA's territory, and they do it well. Drills makes you better at the daily work. Many teams use Drills alongside a CIPFA Certificate or Diploma, not instead of one.",
  },
  {
    q: "Is this aligned to the current IPSAS standards?",
    a: "Yes — Drills covers IPSAS 1 through the most recent issued standards, including IPSAS 41 (Financial Instruments), 43 (Leases), and the public-sector-specific standards (23, 24, 32). Updates are pushed as standards are revised.",
  },
  {
    q: "We're a Ministry — can we get a single account for the whole finance team?",
    a: "Yes. Ministry plans cover unlimited staff in one entity, with a dashboard for the Director of Accounts. We also offer donor-funded pricing for governments where adoption is being supported by an international donor.",
  },
  // Q4 cross-references IPSAS Desk — leave the link as a JSX node so we can render it inline.
] as const

export default function DrillsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* ---------- HERO ---------- */}
        <section className="bg-ppf-navy px-6 pt-[140px] pb-20 text-white md:px-12 md:pt-[160px] md:pb-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ppf-sky">
              Now in beta · Pacific, Sub-Saharan Africa, South Asia
            </p>
            <h1 className="mt-3 max-w-[18ch] text-[clamp(36px,5vw,64px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              IPSAS Drills
            </h1>
            <p className="mt-4 max-w-[40ch] text-[clamp(18px,2vw,22px)] font-medium leading-[1.4] text-ppf-sky">
              Build the reflexes. Close the books faster.
            </p>
            <p className="mt-6 max-w-[62ch] text-[16px] leading-[1.65] text-white/80 md:text-[17px]">
              Short, focused practice questions tuned to the situations your team will actually face — opening balances that won&rsquo;t reconcile, donor grants under IPSAS 23, GFS mapping with a chart of accounts that wasn&rsquo;t designed for it. Built from current implementation work in a Pacific Treasury, not from a textbook.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="rounded-md bg-ppf-sky px-6 py-3 text-center text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
              >
                Start free trial
              </Link>
              {/* TODO: wire to a real sample drill route once one exists. */}
              <Link
                href="/register"
                className="rounded-md border border-ppf-sky/60 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-ppf-sky hover:bg-ppf-sky/10"
              >
                See a sample drill →
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 2 — Why this isn't another IPSAS course ---------- */}
        <section className="border-b border-ink-200 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">Why this isn&rsquo;t another IPSAS course</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              This isn&rsquo;t a course. It&rsquo;s training the way professionals actually train.
            </h2>
            <div className="mt-8 space-y-5 text-[16px] leading-[1.7] text-ink-700">
              <p>
                Most IPSAS training is built around the standards. You read the standard, you watch the video, you sit the exam. That&rsquo;s how you get a certificate — but it&rsquo;s not how you get faster, more accurate, or more confident on a Monday morning when the books need closing.
              </p>
              <p>
                Drills works the way a junior surgeon, a pilot, or an auditor in a Big Four firm trains: short, repeated, focused on the moves you&rsquo;ll actually make. Ten to fifteen minutes a day. Targeted at the situations that come up in real public-sector accounting — not edge cases, not exam tricks, not US-only treatments.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 3 — Built around real implementation pain points ---------- */}
        <section className="bg-ink-50 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">What&rsquo;s in the drills</p>
            <h2 className="mt-3 max-w-[28ch] text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Built around the problems that actually stop IPSAS adoption.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[15px] leading-[1.65] text-ink-700">
              Each drill is graduated by difficulty and tagged to the standard, but organised around real implementation pain points:
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {PAIN_POINTS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-lg border border-ink-200 bg-white p-6 shadow-crisp-sm"
                >
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink-900">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.65] text-ink-700">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SECTION 4 — How it works ---------- */}
        <section className="px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Three steps. Ten minutes a day.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((s) => (
                <div key={s.step}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ppf-sky text-lg font-bold text-white">
                    {s.step}
                  </div>
                  <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.65] text-ink-700">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SECTION 5 — Who it's for ---------- */}
        <section className="bg-ink-50 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">Who it&rsquo;s for</p>
            <h2 className="mt-3 max-w-[32ch] text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Built for the teams who actually have to make IPSAS work.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {AUDIENCE_CARDS.map((c) => (
                <div
                  key={c.title}
                  className="rounded-lg border border-ink-200 bg-white p-6 shadow-crisp-sm"
                >
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink-900">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.65] text-ink-700">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SECTION 6 — Trust signals + donor logo strip ---------- */}
        <section className="border-y border-ink-200 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">Trust signals</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Built by someone currently doing the work.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-ink-700">
              Drills is written and curated by Gregg Pavitt — a public financial management specialist with 25 years of experience across Sub-Saharan Africa, South Asia, and the Pacific, and currently embedded in the Solomon Islands Ministry of Finance &amp; Treasury. The questions come from the implementations he is running and has run, with input from the counterparts who have lived the problems.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-[1240px]">
            <p className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              Donors funding the underlying consulting practice
            </p>
            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 sm:grid-cols-3 lg:grid-cols-6">
              {donors.map((d) => (
                <div
                  key={d.id}
                  title={d.name}
                  className="group flex h-[96px] items-center justify-center bg-white p-5 transition-colors hover:bg-ink-50"
                >
                  <Image
                    src={d.logo}
                    alt={d.name}
                    width={140}
                    height={40}
                    className="max-h-[40px] w-auto object-contain opacity-70 grayscale transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:grayscale-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SECTION 7 — Pricing teaser ---------- */}
        <section className="bg-ppf-pale px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px] text-center">
            <p className="eyebrow">Pricing</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Try it free. Subscribe when it&rsquo;s earning its keep.
            </h2>
            <div className="mt-6 space-y-4 text-[16px] leading-[1.7] text-ink-700">
              <p>
                Start with a 14-day free trial — no credit card needed to look around. Add a card to keep going past day 14. Cancel any time before the first charge.
              </p>
              <p>
                For teams of 5 or more, ministries, or audit firms wanting a single account for the whole staff, see team and organisation pricing.
              </p>
            </div>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="rounded-md bg-ppf-sky px-6 py-3 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
              >
                Start free trial
              </Link>
              <Link
                href="/pricing#drills"
                className="rounded-md border border-ppf-sky px-6 py-3 text-sm font-semibold text-ppf-sky transition-colors hover:bg-ppf-sky hover:text-white"
              >
                See pricing →
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 8 — FAQ ---------- */}
        <section className="px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">FAQ</p>
            <h3 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.02em] text-ink-900">
              Common questions
            </h3>
            <dl className="mt-8 divide-y divide-ink-200">
              {FAQ.map((item) => (
                <div key={item.q} className="py-5">
                  <dt className="text-[15px] font-semibold text-ink-900">
                    {item.q}
                  </dt>
                  <dd className="mt-1.5 text-[14px] leading-[1.65] text-ink-700">
                    {item.a}
                  </dd>
                </div>
              ))}
              {/* Q4 — kept inline so the cross-link to /desk renders as a Link, not raw text. */}
              <div className="py-5">
                <dt className="text-[15px] font-semibold text-ink-900">
                  What if I want one-on-one help on something specific?
                </dt>
                <dd className="mt-1.5 text-[14px] leading-[1.65] text-ink-700">
                  That&rsquo;s what{" "}
                  <Link href="/desk" className="text-ppf-sky underline-offset-2 hover:underline">
                    IPSAS Desk
                  </Link>{" "}
                  is for. Drills builds reflexes; Desk handles the hard cases.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ---------- Cross-product strip ---------- */}
        <section className="border-t border-ink-200 bg-ppf-navy px-6 py-16 text-white md:px-12 md:py-20">
          <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.02em]">
                Drills + Desk go together.
              </h3>
              <p className="mt-2 max-w-[60ch] text-[15px] leading-[1.65] text-white/80">
                Drills builds your team&rsquo;s reflexes on routine treatments. Desk handles the hard cases when they come up.
              </p>
            </div>
            <Link
              href="/pricing#bundle"
              className="shrink-0 rounded-md bg-ppf-sky px-5 py-3 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
            >
              See bundle pricing →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
