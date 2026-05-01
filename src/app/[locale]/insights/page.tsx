// /insights — index of all published posts.
// Posts live in src/lib/insights.ts (zero-dep, typed data).

import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { listInsights } from "@/lib/insights"
import { getDateLocale, localizePath } from "@/i18n/routing"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Insights" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: localizePath("/insights", locale) },
  }
}

export default async function InsightsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Insights" })
  const dateLocale = getDateLocale(locale)
  const posts = listInsights()

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <section className="border-b border-ink-200 bg-ppf-navy px-6 pt-[140px] pb-12 text-white md:px-12 md:pt-[160px] md:pb-16">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow text-white/60">{t("eyebrow")}</p>
            <h1 className="mt-3 max-w-[24ch] text-[clamp(32px,4.2vw,52px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              {t("headline")}
            </h1>
            <p className="mt-5 max-w-[58ch] text-[17px] leading-[1.6] text-white/80">
              {t("lead")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1040px] px-6 py-16 md:px-12 md:py-20">
          <ul className="divide-y divide-ink-200">
            {posts.map((post) => (
              <li key={post.slug} className="py-8 first:pt-0 last:pb-0">
                <Link href={`/insights/${post.slug}`} className="group block">
                  <div className="flex flex-wrap items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                    <span>·</span>
                    <span>{post.readingMinutes} {t("minRead")}</span>
                    {post.tags.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{post.tags.join(" · ")}</span>
                      </>
                    )}
                  </div>
                  <h2 className="mt-2 text-[clamp(20px,2.2vw,26px)] font-semibold leading-[1.2] tracking-[-0.018em] text-ink-900 transition-colors group-hover:text-ppf-sky">
                    {post.title}
                  </h2>
                  <p className="mt-2.5 max-w-[62ch] text-[15px] leading-[1.6] text-ink-700">
                    {post.summary}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ppf-sky">
                    {t("readPost")}
                    <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {posts.length === 0 && (
            <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50 p-10 text-center text-ink-500">
              {t("noPosts")}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
