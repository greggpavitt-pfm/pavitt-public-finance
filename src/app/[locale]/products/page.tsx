// /products — public landing page for the PFS SaaS products.
// Two products:
//   • IPSAS Drills — short, focused practice questions (page: /drills)
//   • IPSAS Desk   — paragraph-cited Q&A reference desk (page: /desk)
// Target audience: Ministry of Finance procurement + training officers.

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
  const t = await getTranslations({ locale, namespace: "Products" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: localizePath("/products", locale) },
  }
}

// Each product's structural fields stay in code (id, anchor, route href,
// number of features, number of pricing tiers); display strings come from
// messages/<locale>.json keyed by `Products.<productKey>.*`.
type ProductStructure = {
  productKey: "drillsProduct" | "deskProduct"
  /** Section anchor — used by /pricing and /drills /desk to deep-link. */
  id: "drills" | "desk"
  ctaHref: string
  featureCount: number
  tierCount: number
}

const PRODUCTS: ProductStructure[] = [
  { productKey: "drillsProduct", id: "drills", ctaHref: "/drills", featureCount: 8, tierCount: 3 },
  { productKey: "deskProduct",   id: "desk",   ctaHref: "/desk",   featureCount: 8, tierCount: 3 },
]

const FAQ_KEYS = ["1", "2", "3", "4", "5"] as const

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Products" })

  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* Hero */}
        <section className="border-b border-ink-200 bg-ppf-navy px-6 pt-[140px] pb-16 text-white md:px-12 md:pt-[160px] md:pb-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow text-white/60">{t("hero.eyebrow")}</p>
            <h1 className="mt-3 max-w-[22ch] text-[clamp(32px,4.2vw,56px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              {t("hero.headline")}
            </h1>
            <p className="mt-5 max-w-[60ch] text-[17px] leading-[1.6] text-white/80">
              {t("hero.lead")}
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
                  {t(`${p.productKey}.kicker` as `${typeof p.productKey}.kicker`)}
                </p>
                <h2 className="mt-3 text-[clamp(26px,2.8vw,36px)] font-semibold leading-[1.15] tracking-[-0.02em] text-ink-900">
                  {t(`${p.productKey}.name` as `${typeof p.productKey}.name`)}
                </h2>
                <p className="mt-3 text-lg font-medium text-ppf-blue">
                  {t(`${p.productKey}.tagline` as `${typeof p.productKey}.tagline`)}
                </p>
                <p className="mt-4 text-[15px] leading-[1.65] text-ink-700">
                  {t(`${p.productKey}.summary` as `${typeof p.productKey}.summary`)}
                </p>
                <Link
                  href={p.ctaHref}
                  className="mt-8 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-4 py-2.5 text-sm font-medium text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
                >
                  {t(`${p.productKey}.ctaLabel` as `${typeof p.productKey}.ctaLabel`)}
                  <span aria-hidden>→</span>
                </Link>
              </div>

              {/* Right — features + pricing */}
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                  {t("common.whatIsIncluded")}
                </h3>
                <ul className="mt-3 space-y-2">
                  {Array.from({ length: p.featureCount }, (_, i) => i + 1).map((n) => (
                    <li
                      key={n}
                      className="flex gap-2.5 text-[14px] leading-[1.55] text-ink-800"
                    >
                      <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ppf-sky" />
                      <span>
                        {t(`${p.productKey}.f${n}` as `${typeof p.productKey}.f${typeof n}`)}
                      </span>
                    </li>
                  ))}
                </ul>

                <h3 className="mt-8 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                  {t("common.licensing")}
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {Array.from({ length: p.tierCount }, (_, i) => i + 1).map((n) => (
                    <div
                      key={n}
                      className="rounded-lg border border-ink-200 bg-ink-50 p-4"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ppf-blue">
                        {t(`${p.productKey}.tier${n}Name` as `${typeof p.productKey}.tier${typeof n}Name`)}
                      </div>
                      <div className="mt-1 text-[15px] font-semibold text-ink-900">
                        {t(`${p.productKey}.tier${n}Headline` as `${typeof p.productKey}.tier${typeof n}Headline`)}
                      </div>
                      <div className="mt-1.5 text-[12px] leading-[1.5] text-ink-600">
                        {t(`${p.productKey}.tier${n}Detail` as `${typeof p.productKey}.tier${typeof n}Detail`)}
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
            <p className="eyebrow">{t("faq.eyebrow")}</p>
            <h2 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.02em] text-ink-900">
              {t("faq.headline")}
            </h2>
            <dl className="mt-8 divide-y divide-ink-200">
              {FAQ_KEYS.map((id) => (
                <div key={id} className="py-5">
                  <dt className="text-[15px] font-semibold text-ink-900">
                    {t(`faq.q${id}` as `faq.q${typeof id}`)}
                  </dt>
                  <dd className="mt-1.5 text-[14px] leading-[1.6] text-ink-700">
                    {t(`faq.a${id}` as `faq.a${typeof id}`)}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-col items-center gap-3 rounded-lg border border-ppf-sky/30 bg-white px-6 py-8 text-center">
              <p className="eyebrow">{t("pilot.eyebrow")}</p>
              <h3 className="text-[clamp(20px,2vw,26px)] font-semibold tracking-[-0.02em] text-ink-900">
                {t("pilot.headline")}
              </h3>
              <p className="max-w-[52ch] text-[14px] leading-[1.6] text-ink-700">
                {t("pilot.body")}
              </p>
              <Link
                href="/#contact"
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-5 py-2.5 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
              >
                {t("pilot.cta")}
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
