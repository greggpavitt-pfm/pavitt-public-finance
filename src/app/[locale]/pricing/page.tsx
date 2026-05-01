// /pricing — Pricing page covering both products plus the bundle.
// Anchors #drills, #desk, #bundle let the product pages deep-link to the right
// section. Copy is taken verbatim from Redesigned-Pages/claude-code-brief.md
// (Step 4). Bundle prices are 20% off the combined annual list — recalculate
// here if list prices change (see PRICING_BUNDLE comment below).

import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { localizePath } from "@/i18n/routing"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Pricing" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: localizePath("/pricing", locale) },
  }
}

// Tier definitions are split between this file (structural — id, CTA href,
// number of features, optional small-print link, optional badge presence)
// and messages/<locale>.json (translatable text — name, price, description,
// features, badge text). Keeping the layout/CTA structure here avoids having
// to re-translate URLs and feature counts.
type TierStructure = {
  id:
    | "drills-individual"
    | "drills-team"
    | "drills-organisation"
    | "desk-practitioner"
    | "desk-firm"
    | "desk-customised"
  ctaKey: "ctaTrial" | "ctaContact"
  ctaHref: string
  /** How many feature lines (f1..fN) this tier has in the messages dict. */
  featureCount: number
  /** True if this tier exposes a coloured "Most popular …" badge. */
  hasBadge: boolean
  /** True if this tier has a small print line under the CTA (only Individual). */
  hasSmallPrint: boolean
  smallLinkHref?: string
}

const DRILLS_TIERS: TierStructure[] = [
  {
    id: "drills-individual",
    ctaKey: "ctaTrial",
    ctaHref: "/register",
    featureCount: 4,
    hasBadge: false,
    hasSmallPrint: true,
    smallLinkHref: "/#contact",
  },
  {
    id: "drills-team",
    ctaKey: "ctaTrial",
    ctaHref: "/register",
    featureCount: 5,
    hasBadge: true,
    hasSmallPrint: false,
  },
  {
    id: "drills-organisation",
    ctaKey: "ctaContact",
    ctaHref: "/#contact",
    featureCount: 5,
    hasBadge: false,
    hasSmallPrint: false,
  },
]

const DESK_TIERS: TierStructure[] = [
  {
    id: "desk-practitioner",
    ctaKey: "ctaTrial",
    ctaHref: "/register",
    featureCount: 4,
    hasBadge: false,
    hasSmallPrint: false,
  },
  {
    id: "desk-firm",
    ctaKey: "ctaContact",
    ctaHref: "/#contact",
    featureCount: 5,
    hasBadge: true,
    hasSmallPrint: false,
  },
  {
    id: "desk-customised",
    ctaKey: "ctaContact",
    ctaHref: "/#contact",
    featureCount: 5,
    hasBadge: false,
    hasSmallPrint: false,
  },
]

const BUNDLE_LINES = ["1", "2", "3", "4"] as const
const FAQ_KEYS = ["1", "2", "3", "4", "5"] as const

type T = (key: string) => string

function PricingCard({ tier, t }: { tier: TierStructure; t: T }) {
  const tierKey = `tiers.${tier.id}`
  const ctaLabel = t(tier.ctaKey)
  return (
    <div className="relative flex flex-col rounded-lg border border-ink-200 bg-white p-6 shadow-crisp-sm">
      {tier.hasBadge ? (
        <div className="absolute -top-3 left-6 rounded-full bg-ppf-sky px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white shadow-crisp-sm">
          {t(`${tierKey}.badge`)}
        </div>
      ) : null}
      <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-ink-900">
        {t(`${tierKey}.name`)}
      </h3>
      <div className="mt-4 text-[24px] font-semibold tracking-[-0.02em] text-ink-900">
        {t(`${tierKey}.price`)}
      </div>
      <div className="mt-1 text-[13px] text-ink-600">{t(`${tierKey}.priceSub`)}</div>
      <p className="mt-4 text-[14px] leading-[1.65] text-ink-700">
        {t(`${tierKey}.description`)}
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {Array.from({ length: tier.featureCount }, (_, i) => i + 1).map((n) => (
          <li
            key={n}
            className="flex gap-2.5 text-[14px] leading-[1.55] text-ink-800"
          >
            <span aria-hidden className="mt-1 shrink-0 text-ppf-sky">✓</span>
            <span>{t(`${tierKey}.f${n}`)}</span>
          </li>
        ))}
      </ul>
      <Link
        href={tier.ctaHref}
        className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-ppf-sky px-4 py-2.5 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
      >
        {ctaLabel}
      </Link>
      {tier.hasSmallPrint && tier.smallLinkHref ? (
        <p className="mt-3 text-[12px] leading-[1.55] text-ink-500">
          {t(`${tierKey}.smallText`)}
          <Link
            href={tier.smallLinkHref}
            className="text-ppf-sky underline-offset-2 hover:underline"
          >
            {t(`${tierKey}.smallLink`)}
          </Link>
        </p>
      ) : null}
    </div>
  )
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = (await getTranslations({ locale, namespace: "Pricing" })) as unknown as T

  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* ---------- HERO ---------- */}
        <section className="bg-ppf-navy px-6 pt-[140px] pb-16 text-white md:px-12 md:pt-[160px] md:pb-20">
          <div className="mx-auto max-w-[1240px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ppf-sky">
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-3 max-w-[22ch] text-[clamp(36px,5vw,64px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              {t("hero.headline")}
            </h1>
            <p className="mt-4 max-w-[40ch] text-[clamp(18px,2vw,22px)] font-medium leading-[1.4] text-ppf-sky">
              {t("hero.tagline")}
            </p>
            <p className="mt-6 max-w-[68ch] text-[16px] leading-[1.65] text-white/80 md:text-[17px]">
              {t("hero.lead")}
            </p>
          </div>
        </section>

        {/* ---------- SECTION 1 — IPSAS Drills pricing ---------- */}
        <section id="drills" className="scroll-mt-[120px] px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">{t("drillsSection.eyebrow")}</p>
            <h2 className="mt-3 max-w-[40ch] text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("drillsSection.headline")}
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {DRILLS_TIERS.map((tier) => (
                <PricingCard key={tier.id} tier={tier} t={t} />
              ))}
            </div>
            <p className="mt-8 text-[13px] italic leading-[1.65] text-ink-600">
              <strong className="not-italic font-semibold text-ink-900">
                {t("drillsSection.donorNotePart1")}
              </strong>
              {t("drillsSection.donorNotePart2")}
              <Link
                href="/#contact"
                className="text-ppf-sky underline-offset-2 hover:underline"
              >
                {t("drillsSection.donorNoteLink")}
              </Link>
              {t("drillsSection.donorNotePart3")}
            </p>
          </div>
        </section>

        {/* ---------- SECTION 2 — IPSAS Desk pricing ---------- */}
        <section
          id="desk"
          className="scroll-mt-[120px] border-t border-ink-200 bg-ink-50 px-6 py-20 md:px-12 md:py-24"
        >
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">{t("deskSection.eyebrow")}</p>
            <h2 className="mt-3 max-w-[40ch] text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("deskSection.headline")}
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {DESK_TIERS.map((tier) => (
                <PricingCard key={tier.id} tier={tier} t={t} />
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SECTION 3 — Bundle ---------- */}
        <section
          id="bundle"
          className="scroll-mt-[120px] border-t border-ink-200 px-6 py-20 md:px-12 md:py-24"
        >
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">{t("bundle.eyebrow")}</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("bundle.headline")}
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-ink-700">
              {t("bundle.lead")}
            </p>

            <div className="mt-10 rounded-lg border border-ppf-sky/30 bg-ppf-pale p-6 md:p-8">
              <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-ink-900">
                {t("bundle.boxTitle")}
              </h3>
              <dl className="mt-5 divide-y divide-ink-200">
                {BUNDLE_LINES.map((id) => (
                  <div
                    key={id}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between"
                  >
                    <dt className="text-[14px] font-medium text-ink-900">
                      {t(`bundle.line${id}Label`)}
                    </dt>
                    <dd className="text-[14px] tabular-nums text-ink-700">
                      {t(`bundle.line${id}Price`)}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link
                href="/#contact"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-5 py-2.5 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
              >
                {t("bundle.cta")}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 4 — Regional and donor-funded pricing ---------- */}
        <section className="border-t border-ink-200 bg-ink-50 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">{t("regional.eyebrow")}</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              {t("regional.headline")}
            </h2>
            <div className="mt-8 space-y-5 text-[16px] leading-[1.7] text-ink-700">
              <p>{t("regional.p1")}</p>
              <p>{t("regional.p2")}</p>
              <p>{t("regional.p3")}</p>
            </div>
            <Link
              href="/#contact"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-5 py-2.5 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
            >
              {t("regional.cta")}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* ---------- SECTION 5 — Pricing FAQ ---------- */}
        <section className="border-t border-ink-200 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">{t("faq.eyebrow")}</p>
            <h3 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.02em] text-ink-900">
              {t("faq.headline")}
            </h3>
            <dl className="mt-8 divide-y divide-ink-200">
              {FAQ_KEYS.map((id) => (
                <div key={id} className="py-5">
                  <dt className="text-[15px] font-semibold text-ink-900">
                    {t(`faq.q${id}`)}
                  </dt>
                  <dd className="mt-1.5 text-[14px] leading-[1.65] text-ink-700">
                    {t(`faq.a${id}`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
