// /drills — IPSAS Drills product page.
// Replaces /ipsas-training (which now 301-redirects here via next.config.ts).
// Copy is taken verbatim from Redesigned-Pages/claude-code-brief.md (Step 2).
// Design language matches /products and the rest of the marketing site:
//   ppf-navy hero, ink-200 bordered cards, eyebrow/H1 typography, max-w-[1240px].

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { donors } from "@/lib/content"
import { localizePath } from "@/i18n/routing"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Drills" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: localizePath("/drills", locale) },
  }
}

// Drill topic codes + IPSAS standard arrays. The codes (DT-01..DT-15) map
// 1:1 to messages.Drills.topics.items.<code>-name / -tagline. Standards
// arrays stay in code because they are technical identifiers (e.g.
// "IPSAS 17") that must not be translated.
type DrillTopic = {
  code: string
  standards: string[]
}

const DRILL_TOPICS: DrillTopic[] = [
  { code: "DT-01", standards: ["IPSAS 17", "33", "46"] },
  { code: "DT-02", standards: ["IPSAS 23", "47"] },
  { code: "DT-03", standards: ["IPSAS 39", "19"] },
  { code: "DT-04", standards: ["IPSAS 19", "28"] },
  { code: "DT-05", standards: ["IPSAS 35", "36", "37"] },
  { code: "DT-06", standards: ["IPSAS 24", "1"] },
  { code: "DT-07", standards: ["IPSAS 41", "28", "30"] },
  { code: "DT-08", standards: ["IPSAS 21", "26"] },
  { code: "DT-09", standards: ["IPSAS 32", "17"] },
  { code: "DT-10", standards: ["IPSAS 12"] },
  { code: "DT-11", standards: ["IPSAS 43", "17"] },
  { code: "DT-12", standards: ["IPSAS 1", "2", "3"] },
  { code: "DT-13", standards: ["IPSAS 33", "3", "46"] },
  { code: "DT-14", standards: ["IPSAS 23", "47", "35"] },
  { code: "DT-15", standards: ["IPSAS 35", "2", "24"] },
]

const PAIN_KEYS = ["1", "2", "3"] as const
const STEP_KEYS = ["1", "2", "3"] as const
const AUDIENCE_KEYS = ["1", "2", "3"] as const
const FAQ_KEYS = ["1", "2", "3"] as const

export default async function DrillsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Drills" })
  const tDonors = await getTranslations({ locale, namespace: "Donors" })

  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* ---------- HERO ---------- */}
        <section className="bg-ppf-navy px-6 pt-[140px] pb-20 text-white md:px-12 md:pt-[160px] md:pb-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ppf-sky">
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-3 max-w-[18ch] text-[clamp(36px,5vw,64px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              {t("hero.headline")}
            </h1>
            <p className="mt-4 max-w-[40ch] text-[clamp(18px,2vw,22px)] font-medium leading-[1.4] text-ppf-sky">
              {t("hero.tagline")}
            </p>
            <p className="mt-6 max-w-[62ch] text-[16px] leading-[1.65] text-white/80 md:text-[17px]">
              {t("hero.lead")}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="rounded-md bg-ppf-sky px-6 py-3 text-center text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
              >
                {t("hero.ctaTrial")}
              </Link>
              {/* TODO: wire to a real sample drill route once one exists. */}
              <Link
                href="/register"
                className="rounded-md border border-ppf-sky/60 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-ppf-sky hover:bg-ppf-sky/10"
              >
                {t("hero.ctaSample")}
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 2 — Why this isn't another IPSAS course ---------- */}
        <section className="border-b border-ink-200 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">{t("whyNot.eyebrow")}</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("whyNot.headline")}
            </h2>
            <div className="mt-8 space-y-5 text-[16px] leading-[1.7] text-ink-700">
              <p>{t("whyNot.p1")}</p>
              <p>{t("whyNot.p2")}</p>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 3 — Built around real implementation pain points ---------- */}
        <section className="bg-ink-50 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">{t("painPoints.eyebrow")}</p>
            <h2 className="mt-3 max-w-[28ch] text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("painPoints.headline")}
            </h2>
            <p className="mt-5 max-w-[60ch] text-[15px] leading-[1.65] text-ink-700">
              {t("painPoints.lead")}
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {PAIN_KEYS.map((id) => (
                <div
                  key={id}
                  className="rounded-lg border border-ink-200 bg-white p-6 shadow-crisp-sm"
                >
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink-900">
                    {t(`painPoints.card${id}Title` as `painPoints.card${typeof id}Title`)}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.65] text-ink-700">
                    {t(`painPoints.card${id}Body` as `painPoints.card${typeof id}Body`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SECTION 3b — Full topic coverage (compact tile grid) ---------- */}
        {/* Static scope-reassurance grid. All 15 drill topics + lead IPSAS standards on the
            page so visitors searching for "IPSAS 17 PPE" or "IPSAS 43 leases" land here. */}
        <section className="border-t border-ink-200 bg-white px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">{t("topics.eyebrow")}</p>
            <h2 className="mt-3 max-w-[28ch] text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("topics.headline")}
            </h2>
            <p className="mt-5 max-w-[60ch] text-[15px] leading-[1.65] text-ink-700">
              {t("topics.lead")}
            </p>

            <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {DRILL_TOPICS.map((topic) => {
                // Topic name + tagline come from messages, keyed by drill code (DT-01 …).
                const name = t(`topics.items.${topic.code}-name` as `topics.items.${typeof topic.code}-name`)
                const tagline = t(`topics.items.${topic.code}-tagline` as `topics.items.${typeof topic.code}-tagline`)
                return (
                  <li
                    key={topic.code}
                    className="rounded-md border border-ink-200 bg-white p-4 shadow-crisp-sm"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                      {topic.code}
                    </p>
                    <h3 className="mt-1.5 text-[14px] font-semibold leading-[1.3] tracking-[-0.01em] text-ink-900">
                      {name}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] leading-[1.5] text-ink-700">
                      {tagline}
                    </p>
                    <p className="mt-3 text-[11px] font-medium text-ppf-blue">
                      {/* Render full IPSAS prefix on first standard, then bare numbers separated by middle-dot. */}
                      {topic.standards.map((s, i) => (i === 0 ? s : ` · ${s}`)).join("")}
                    </p>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        {/* ---------- SECTION 4 — How it works ---------- */}
        <section className="px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">{t("howItWorks.eyebrow")}</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("howItWorks.headline")}
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {STEP_KEYS.map((id) => (
                <div key={id}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ppf-sky text-lg font-bold text-white">
                    {id}
                  </div>
                  <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink-900">
                    {t(`howItWorks.step${id}Title` as `howItWorks.step${typeof id}Title`)}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.65] text-ink-700">
                    {t(`howItWorks.step${id}Body` as `howItWorks.step${typeof id}Body`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SECTION 5 — Who it's for ---------- */}
        <section className="bg-ink-50 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">{t("audience.eyebrow")}</p>
            <h2 className="mt-3 max-w-[32ch] text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("audience.headline")}
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {AUDIENCE_KEYS.map((id) => (
                <div
                  key={id}
                  className="rounded-lg border border-ink-200 bg-white p-6 shadow-crisp-sm"
                >
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink-900">
                    {t(`audience.card${id}Title` as `audience.card${typeof id}Title`)}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.65] text-ink-700">
                    {t(`audience.card${id}Body` as `audience.card${typeof id}Body`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SECTION 6 — Trust signals + donor logo strip ---------- */}
        <section className="border-y border-ink-200 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">{t("trust.eyebrow")}</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("trust.headline")}
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-ink-700">
              {t("trust.lead")}
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-[1240px]">
            <p className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              {t("trust.donorsHeadline")}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 sm:grid-cols-3 lg:grid-cols-6">
              {donors.map((d) => {
                const name = tDonors(`names.${d.id}` as `names.${typeof d.id}`)
                return (
                  <div
                    key={d.id}
                    title={name}
                    className="group flex h-[96px] items-center justify-center bg-white p-5 transition-colors hover:bg-ink-50"
                  >
                    <Image
                      src={d.logo}
                      alt={name}
                      width={140}
                      height={40}
                      className="max-h-[40px] w-auto object-contain opacity-70 grayscale transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ---------- SECTION 7 — Pricing teaser ---------- */}
        <section className="bg-ppf-pale px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px] text-center">
            <p className="eyebrow">{t("pricing.eyebrow")}</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("pricing.headline")}
            </h2>
            <div className="mt-6 space-y-4 text-[16px] leading-[1.7] text-ink-700">
              <p>{t("pricing.p1")}</p>
              <p>{t("pricing.p2")}</p>
            </div>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="rounded-md bg-ppf-sky px-6 py-3 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
              >
                {t("pricing.ctaTrial")}
              </Link>
              <Link
                href="/pricing#drills"
                className="rounded-md border border-ppf-sky px-6 py-3 text-sm font-semibold text-ppf-sky transition-colors hover:bg-ppf-sky hover:text-white"
              >
                {t("pricing.ctaPricing")}
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 8 — FAQ ---------- */}
        <section className="px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">{t("faq.eyebrow")}</p>
            <h3 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.02em] text-ink-900">
              {t("faq.headline")}
            </h3>
            <dl className="mt-8 divide-y divide-ink-200">
              {FAQ_KEYS.map((id) => (
                <div key={id} className="py-5">
                  <dt className="text-[15px] font-semibold text-ink-900">
                    {t(`faq.q${id}` as `faq.q${typeof id}`)}
                  </dt>
                  <dd className="mt-1.5 text-[14px] leading-[1.65] text-ink-700">
                    {t(`faq.a${id}` as `faq.a${typeof id}`)}
                  </dd>
                </div>
              ))}
              {/* Q4 — kept inline so the cross-link to /desk renders as a Link, not raw text. */}
              <div className="py-5">
                <dt className="text-[15px] font-semibold text-ink-900">
                  {t("faq.q4")}
                </dt>
                <dd className="mt-1.5 text-[14px] leading-[1.65] text-ink-700">
                  {t("faq.a4Part1")}
                  <Link href="/desk" className="text-ppf-sky underline-offset-2 hover:underline">
                    {t("faq.a4LinkLabel")}
                  </Link>
                  {t("faq.a4Part2")}
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
                {t("cross.headline")}
              </h3>
              <p className="mt-2 max-w-[60ch] text-[15px] leading-[1.65] text-white/80">
                {t("cross.body")}
              </p>
            </div>
            <Link
              href="/pricing#bundle"
              className="shrink-0 rounded-md bg-ppf-sky px-5 py-3 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
            >
              {t("cross.cta")}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
