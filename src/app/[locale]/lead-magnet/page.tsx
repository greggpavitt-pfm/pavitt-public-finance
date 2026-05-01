// /lead-magnet — public landing page for the IPSAS adoption checklist.
// Email capture form → newsletter_signups table → checklist download.

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import LeadMagnetForm from "./LeadMagnetForm"
import { localizePath } from "@/i18n/routing"

// 12 checklist items keyed item1..item12 — fixed list, so the array of keys
// stays in sync with messages/<locale>.json. Reordering means renaming the
// keys in the dictionary too (intentional friction).
const CHECKLIST_KEYS = [
  "item1", "item2", "item3", "item4", "item5", "item6",
  "item7", "item8", "item9", "item10", "item11", "item12",
] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "LeadMagnet" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: localizePath("/lead-magnet", locale) },
  }
}

export default async function LeadMagnetPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "LeadMagnet" })

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <section className="border-b border-ink-200 bg-ppf-navy px-6 pt-[140px] pb-12 text-white md:px-12 md:pt-[160px] md:pb-16">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow text-white/60">{t("eyebrow")}</p>
            <h1 className="mt-3 max-w-[26ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.05] tracking-[-0.025em]">
              {t("headline")}
            </h1>
            <p className="mt-5 max-w-[58ch] text-[17px] leading-[1.6] text-white/80">
              {t("lead")}
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1100px] gap-12 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:gap-16 md:px-8 md:py-24">
          {/* Preview */}
          <div>
            <h2 className="text-[clamp(20px,2.2vw,26px)] font-semibold tracking-[-0.018em] text-ink-900">
              {t("whatIsInChecklist")}
            </h2>
            <ol className="mt-6 space-y-3">
              {CHECKLIST_KEYS.map((key, i) => (
                <li
                  key={key}
                  className="flex gap-3 text-[15px] leading-[1.6] text-ink-800"
                >
                  <span
                    aria-hidden
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ppf-pale font-mono text-[11px] font-semibold text-ppf-blue"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{t(`checklist.${key}` as `checklist.${typeof key}`)}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Form */}
          <aside className="md:sticky md:top-[120px] md:self-start">
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-6 shadow-crisp-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ppf-blue">
                {t("form.downloadEyebrow")}
              </p>
              <h3 className="mt-2 text-[18px] font-semibold tracking-[-0.012em] text-ink-900">
                {t("form.downloadHeadline")}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-ink-600">
                {t("form.downloadLead")}
              </p>

              <LeadMagnetForm />

              <p className="mt-4 text-[11px] leading-[1.5] text-ink-500">
                {t("form.privacyNote")}
              </p>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  )
}
