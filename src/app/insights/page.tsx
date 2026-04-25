// /insights — index of all published posts.
// Posts live in src/lib/insights.ts (zero-dep, typed data).

import type { Metadata } from "next"
import Link from "next/link"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { listInsights } from "@/lib/insights"

export const metadata: Metadata = {
  title: "Insights — IPSAS practice notes",
  description:
    "Short practical notes on IPSAS standards, cash-basis adoption, PFM reform, and IFMIS design — written for ministry finance staff.",
  alternates: { canonical: "/insights" },
}

export default function InsightsIndexPage() {
  const posts = listInsights()

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <section className="border-b border-ink-200 bg-ppf-navy px-6 pt-[140px] pb-12 text-white md:px-12 md:pt-[160px] md:pb-16">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow text-white/60">Insights</p>
            <h1 className="mt-3 max-w-[24ch] text-[clamp(32px,4.2vw,52px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              Practice notes on IPSAS, PFM, and IFMIS design.
            </h1>
            <p className="mt-5 max-w-[58ch] text-[17px] leading-[1.6] text-white/80">
              Short, concrete guidance for ministry finance staff — written from
              field engagements across the Pacific, Africa, and South Asia.
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
                      {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                    <span>·</span>
                    <span>{post.readingMinutes} min read</span>
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
                    Read the post
                    <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {posts.length === 0 && (
            <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50 p-10 text-center text-ink-500">
              No posts yet.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
