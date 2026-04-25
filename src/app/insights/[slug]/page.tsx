// /insights/[slug] — single post view.
// Renders typed blocks from src/lib/insights.ts via JSX (no markdown parser).

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { INSIGHTS, getInsightBySlug, type InsightBlock } from "@/lib/insights"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return INSIGHTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getInsightBySlug(slug)
  if (!post) return { title: "Post not found" }

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/insights/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
    },
  }
}

function renderBlock(block: InsightBlock, idx: number) {
  switch (block.type) {
    case "p":
      return (
        <p key={idx} className="mt-5 text-[16px] leading-[1.75] text-ink-800">
          {block.text}
        </p>
      )
    case "h2":
      return (
        <h2
          key={idx}
          className="mt-12 text-[clamp(20px,2.2vw,26px)] font-semibold leading-[1.2] tracking-[-0.018em] text-ink-900"
        >
          {block.text}
        </h2>
      )
    case "h3":
      return (
        <h3
          key={idx}
          className="mt-8 text-[clamp(17px,1.8vw,20px)] font-semibold leading-[1.25] tracking-[-0.012em] text-ink-900"
        >
          {block.text}
        </h3>
      )
    case "ul":
      return (
        <ul key={idx} className="mt-5 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[16px] leading-[1.65] text-ink-800">
              <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ppf-sky" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case "quote":
      return (
        <blockquote
          key={idx}
          className="mt-8 rounded-md border-l-4 border-ppf-sky bg-ppf-pale px-5 py-4"
        >
          <p className="text-[17px] font-medium leading-[1.55] tracking-[-0.005em] text-ink-900">
            &ldquo;{block.text}&rdquo;
          </p>
          {block.cite && (
            <footer className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-500">
              {block.cite}
            </footer>
          )}
        </blockquote>
      )
    case "code":
      return (
        <pre
          key={idx}
          className="mt-5 overflow-x-auto rounded-md border border-ink-200 bg-ink-50 p-4 font-mono text-[13px] leading-[1.6] text-ink-900"
        >
          <code>{block.text}</code>
        </pre>
      )
  }
}

export default async function InsightPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getInsightBySlug(slug)
  if (!post) notFound()

  // JSON-LD Article schema for rich snippets
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    author: { "@type": "Person", name: "Gregg Pavitt" },
    publisher: {
      "@type": "Organization",
      name: "Pavitt Public Finance",
      url: "https://pfmexpert.net",
    },
    keywords: post.tags.join(", "),
  }

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <article className="mx-auto max-w-[760px] px-6 pt-[140px] pb-16 md:px-8 md:pt-[160px] md:pb-24">
          <Link
            href="/insights"
            className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ppf-sky"
          >
            ← All insights
          </Link>

          <header className="mt-6">
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
            </div>
            <h1 className="mt-3 text-[clamp(28px,3.6vw,42px)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900">
              {post.title}
            </h1>
            <p className="mt-4 text-[18px] leading-[1.6] text-ink-700">
              {post.summary}
            </p>
            {post.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-ink-200 bg-ink-50 px-2 py-0.5 font-mono text-[11px] tracking-[0.05em] text-ink-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="mt-10 border-t border-ink-200 pt-2">
            {post.body.map((block, idx) => renderBlock(block, idx))}
          </div>

          <footer className="mt-14 rounded-lg border border-ppf-sky/30 bg-ppf-pale px-6 py-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ppf-blue">
              Need this in your workflow?
            </p>
            <p className="mt-2 text-[15px] leading-[1.6] text-ink-800">
              Pavitt Public Finance offers an IPSAS practitioner advisor that
              answers questions like the ones in this post — with paragraph-level
              citations and clarifying-question support for ESL users.
            </p>
            <Link
              href="/products#advisor"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-4 py-2 text-sm font-medium text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
            >
              See the advisor
              <span aria-hidden>→</span>
            </Link>
          </footer>
        </article>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      </main>
      <Footer />
    </>
  )
}
