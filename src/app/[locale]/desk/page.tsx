// /desk — IPSAS Desk product page.
// Replaces /ipsas-questions (which now 301-redirects here via next.config.ts).
// Copy is taken verbatim from Redesigned-Pages/claude-code-brief.md (Step 3).

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { donors } from "@/lib/content"

export const metadata: Metadata = {
  title: "IPSAS Desk — Pavitt Public Finance",
  description:
    "Sourced, paragraph-cited IPSAS answers for government finance teams and audit firms. Built for IPSAS first, not IFRS with public-sector mode. Free trial.",
  alternates: { canonical: "/desk" },
}

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Set your context",
    body: "Tell the Desk your jurisdiction, entity type, reporting basis (cash, modified accrual, full accrual), and which IPSAS standards you've adopted. Answers are tuned to your situation, not generic.",
  },
  {
    step: "2",
    title: "Ask in plain language",
    body: "“We received a USD 4m grant from a bilateral donor with conditions tied to construction milestones. How do we recognise this under IPSAS 23?” The Desk identifies the applicable standard, reads any documents you upload, and answers in context.",
  },
  {
    step: "3",
    title: "Use the answer",
    body: "Paragraph citations, recommended treatment, suggested working-paper note. Copy what you need into your file. The citation is verifiable — it points to a real paragraph in a real standard.",
  },
]

const AUDIENCE_CARDS = [
  {
    title: "Senior accountants and CFOs in government",
    body: "For when the question is too hard for the team but too small to bring in a consultant. Get a sourced answer fast, defend it to your auditor, move on.",
  },
  {
    title: "Audit firms outside the Big Four",
    body: "For firms that audit governments but don't have a public-sector technical desk. The Desk fills that role: ask, cite, document, sign.",
  },
  {
    title: "PFM advisors and donor-project staff",
    body: "For consultants who need to give a defensible answer quickly to a Ministry counterpart, with the citation already attached.",
  },
]

const FAQ_TEXT_ONLY = [
  {
    q: "How is this different from ChatGPT or general AI tools?",
    a: "ChatGPT will confidently cite IPSAS paragraph numbers that don't exist. The Desk is grounded in the actual standards: every citation is traceable to a real paragraph. If the answer isn't in the source, the Desk says so.",
  },
  {
    q: "How is this different from IFRS Buddy / Acclara / IFRS Companion?",
    a: "Those tools are excellent at IFRS. They handle IPSAS as a secondary feature, if at all. The Desk is built for IPSAS first.",
  },
  {
    q: "Can it handle our local jurisdiction?",
    a: "Standard plans answer in IPSAS terms with general public-sector context. Customised plans add your local statute, regulations, and accounting manual to the reference base, so the answer reflects your specific compliance environment.",
  },
  {
    q: "Will the answer hold up in an audit?",
    a: "The citation will. The accounting position is yours and your auditor's to agree on — but the Desk gives you a defensible, sourced starting point with the paragraph reference your auditor will ask for anyway.",
  },
]

export default function DeskPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* ---------- HERO ---------- */}
        <section className="bg-ppf-navy px-6 pt-[140px] pb-20 text-white md:px-12 md:pt-[160px] md:pb-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ppf-sky">
              Now in beta · For practitioners and audit teams
            </p>
            <h1 className="mt-3 max-w-[18ch] text-[clamp(36px,5vw,64px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              IPSAS Desk
            </h1>
            <p className="mt-4 max-w-[40ch] text-[clamp(18px,2vw,22px)] font-medium leading-[1.4] text-ppf-sky">
              The technical reference desk for teams without one.
            </p>
            <p className="mt-6 max-w-[62ch] text-[16px] leading-[1.65] text-white/80 md:text-[17px]">
              Ask any IPSAS question in plain English. Get a sourced answer with the exact paragraph citation, written so it can go straight into your working papers. Built specifically for IPSAS — not IFRS with public-sector content bolted on.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="rounded-md bg-ppf-sky px-6 py-3 text-center text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
              >
                Start free trial
              </Link>
              {/* TODO: wire to a real sample answer page once one exists. */}
              <Link
                href="/register"
                className="rounded-md border border-ppf-sky/60 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-ppf-sky hover:bg-ppf-sky/10"
              >
                See a sample answer →
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 2 — What it does ---------- */}
        <section className="border-b border-ink-200 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">What it does</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Twenty seconds. Paragraph reference. Plain English.
            </h2>
            <div className="mt-8 space-y-5 text-[16px] leading-[1.7] text-ink-700">
              <p>
                A senior PFM advisor bills somewhere between USD 800 and USD 2,000 per day. For most public-sector accounting questions, that&rsquo;s the wrong tool — too expensive, too slow, and unavailable when you need an answer in time for the close.
              </p>
              <p>
                The Desk is the right tool for those questions. Ask in plain English. Upload supporting documentation if it helps. You get back the applicable standard, the specific paragraph(s), the recommended treatment for your context, and — where it matters — a note on what working-paper documentation an auditor will expect.
              </p>
              <p>
                Every answer is grounded in the actual IPSAS source text. Citations are real and verifiable. The Desk is designed never to invent a paragraph reference that doesn&rsquo;t exist.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 3 — IPSAS first ---------- */}
        <section className="bg-ink-50 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">IPSAS-first</p>
            <h2 className="mt-3 max-w-[28ch] text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Built for IPSAS first, not IFRS with public-sector mode.
            </h2>
            <div className="mt-8 space-y-5 text-[16px] leading-[1.7] text-ink-700">
              <p>
                Most AI accounting tools were built for the IFRS / FASB market and added IPSAS later, if at all. The result: shallow handling of the standards that matter most in public sector — IPSAS 23 (non-exchange revenue), 24 (budget reporting), 32 (service concession arrangements), 35 (consolidated statements), and the GFS reconciliation that ties government accounts back to fiscal reporting.
              </p>
              <p>
                The Desk is built around those standards, by a practitioner who applies them on real engagements. The IFRS-equivalent treatments are there too, where they help — but the centre of gravity is public sector.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 4 — How it works ---------- */}
        <section className="px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Three steps. Sourced answer.
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

        {/* ---------- SECTION 5 — Who uses the Desk ---------- */}
        <section className="bg-ink-50 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">Who uses the Desk</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Built for teams who need a defensible answer fast.
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

        {/* ---------- SECTION 6 — What the Desk doesn't do ---------- */}
        {/* Deliberately honest about limits — do not soften this section. */}
        <section className="border-y border-ink-200 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">Limits</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              What the Desk doesn&rsquo;t do.
            </h2>
            <div className="mt-8 space-y-5 text-[16px] leading-[1.7] text-ink-700">
              <p>
                The Desk is a research and reference tool, not a replacement for professional judgment or audit. It will give you a sourced position on an IPSAS question; you and your team are still responsible for the accounting decision and the audit response.
              </p>
              <p>
                It also doesn&rsquo;t pretend to know what it doesn&rsquo;t know. If a question requires entity-specific information the Desk doesn&rsquo;t have, it asks. If a question falls outside IPSAS into local statute or regulation, it says so — unless you&rsquo;re on a Customised plan, where local statute and regulation can be added to the Desk&rsquo;s reference base.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 7 — Trust signals + donor logos ---------- */}
        <section className="px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">Trust signals</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Sourced answers. Built by a practitioner, not a chatbot vendor.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-ink-700">
              The Desk is curated and operated by Gregg Pavitt, a public financial management specialist with 25 years of work across Sub-Saharan Africa, South Asia, and the Pacific. The reference base is the actual IPSAS standards — IPSAS 1 through the most recently issued — plus IPSASB framework documents and selected public-sector application guidance. Updates are pushed as standards are revised.
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

        {/* ---------- SECTION 8 — Pricing teaser ---------- */}
        <section className="bg-ppf-pale px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px] text-center">
            <p className="eyebrow">Pricing</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Try it free. Subscribe when you&rsquo;ve used it on a real question.
            </h2>
            <div className="mt-6 space-y-4 text-[16px] leading-[1.7] text-ink-700">
              <p>
                Start with a 14-day free trial — generous query allowance, no credit card needed to look around. Add a card to keep going past day 14.
              </p>
              <p>
                For audit firms, ministries, and donor-funded organisations, see team and organisation pricing. Customised plans (your local statute and regulation added to the reference base) are available for organisations that need them.
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
                href="/pricing#desk"
                className="rounded-md border border-ppf-sky px-6 py-3 text-sm font-semibold text-ppf-sky transition-colors hover:bg-ppf-sky hover:text-white"
              >
                See pricing →
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 9 — FAQ ---------- */}
        <section className="px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">FAQ</p>
            <h3 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.02em] text-ink-900">
              Common questions
            </h3>
            <dl className="mt-8 divide-y divide-ink-200">
              {FAQ_TEXT_ONLY.map((item) => (
                <div key={item.q} className="py-5">
                  <dt className="text-[15px] font-semibold text-ink-900">
                    {item.q}
                  </dt>
                  <dd className="mt-1.5 text-[14px] leading-[1.65] text-ink-700">
                    {item.a}
                  </dd>
                </div>
              ))}
              {/* Q5 — has cross-link to /drills, kept inline so Link renders. */}
              <div className="py-5">
                <dt className="text-[15px] font-semibold text-ink-900">
                  What if I&rsquo;m just learning IPSAS?
                </dt>
                <dd className="mt-1.5 text-[14px] leading-[1.65] text-ink-700">
                  The Desk is built for practitioners with a working knowledge. If you&rsquo;re learning the standards,{" "}
                  <Link href="/drills" className="text-ppf-sky underline-offset-2 hover:underline">
                    IPSAS Drills
                  </Link>{" "}
                  is the better starting point.
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
