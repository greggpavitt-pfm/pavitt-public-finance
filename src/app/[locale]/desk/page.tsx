// /desk — IPSAS Desk product page.
// Replaces /ipsas-questions (which now 301-redirects here via next.config.ts).
// Copy is taken verbatim from Redesigned-Pages/claude-code-brief.md (Step 3).

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { donors } from "@/lib/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Desk" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/desk" },
  }
}

// Step ids and audience-card ids are stable; the human-readable text comes
// from messages/<locale>.json keyed by step id.
const HOW_STEP_KEYS = ["1", "2", "3"] as const
const AUDIENCE_KEYS = ["1", "2", "3"] as const
const FAQ_KEYS = ["1", "2", "3", "4"] as const

export default async function DeskPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Desk" })
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
              {/* TODO: wire to a real sample answer page once one exists. */}
              <Link
                href="/register"
                className="rounded-md border border-ppf-sky/60 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-ppf-sky hover:bg-ppf-sky/10"
              >
                {t("hero.ctaSample")}
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 2 — What it does ---------- */}
        <section className="border-b border-ink-200 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">{t("what.eyebrow")}</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("what.headline")}
            </h2>
            <div className="mt-8 space-y-5 text-[16px] leading-[1.7] text-ink-700">
              <p>{t("what.p1")}</p>
              <p>{t("what.p2")}</p>
              <p>{t("what.p3")}</p>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 3 — IPSAS first ---------- */}
        <section className="bg-ink-50 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">{t("ipsasFirst.eyebrow")}</p>
            <h2 className="mt-3 max-w-[28ch] text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("ipsasFirst.headline")}
            </h2>
            <div className="mt-8 space-y-5 text-[16px] leading-[1.7] text-ink-700">
              <p>{t("ipsasFirst.p1")}</p>
              <p>{t("ipsasFirst.p2")}</p>
            </div>
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
              {HOW_STEP_KEYS.map((id) => (
                <div key={id}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ppf-sky text-lg font-bold text-white">
                    {id}
                  </div>
                  <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink-900">
                    {t(`howItWorks.steps.step${id}Title` as `howItWorks.steps.step${typeof id}Title`)}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.65] text-ink-700">
                    {t(`howItWorks.steps.step${id}Body` as `howItWorks.steps.step${typeof id}Body`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SECTION 5 — Who uses the Desk ---------- */}
        <section className="bg-ink-50 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">{t("audience.eyebrow")}</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("audience.headline")}
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {AUDIENCE_KEYS.map((id) => (
                <div
                  key={id}
                  className="rounded-lg border border-ink-200 bg-white p-6 shadow-crisp-sm"
                >
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink-900">
                    {t(`audience.cards.card${id}Title` as `audience.cards.card${typeof id}Title`)}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.65] text-ink-700">
                    {t(`audience.cards.card${id}Body` as `audience.cards.card${typeof id}Body`)}
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
            <p className="eyebrow">{t("limits.eyebrow")}</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("limits.headline")}
            </h2>
            <div className="mt-8 space-y-5 text-[16px] leading-[1.7] text-ink-700">
              <p>{t("limits.p1")}</p>
              <p>{t("limits.p2")}</p>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 7 — Trust signals + donor logos ---------- */}
        <section className="px-6 py-20 md:px-12 md:py-24">
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

        {/* ---------- SECTION 8 — Pricing teaser ---------- */}
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
                href="/pricing#desk"
                className="rounded-md border border-ppf-sky px-6 py-3 text-sm font-semibold text-ppf-sky transition-colors hover:bg-ppf-sky hover:text-white"
              >
                {t("pricing.ctaPricing")}
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 9 — FAQ ---------- */}
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
              {/* Q5 — has cross-link to /drills, kept inline so Link renders. */}
              <div className="py-5">
                <dt className="text-[15px] font-semibold text-ink-900">
                  {t("faq.q5")}
                </dt>
                <dd className="mt-1.5 text-[14px] leading-[1.65] text-ink-700">
                  {t("faq.a5Part1")}
                  <Link href="/drills" className="text-ppf-sky underline-offset-2 hover:underline">
                    {t("faq.a5LinkLabel")}
                  </Link>
                  {t("faq.a5Part2")}
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
