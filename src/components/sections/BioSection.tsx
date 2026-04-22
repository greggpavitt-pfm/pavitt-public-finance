// src/components/sections/BioSection.tsx  (v2 fintech — drop-in replacement)
//
// Sticky headshot + quick-facts card on the left;
// heading, all 4 bio paragraphs, and a pull-quote on the right.
"use client"
import Image from "next/image"
import { bio, images, siteConfig } from "@/lib/content"
import { useReveal } from "@/lib/useReveal"

const FACTS = [
  { k: "Based",      v: "Sub-Saharan Africa / Pacific" },
  { k: "Experience", v: "25+ years" },
  { k: "Countries",  v: "15" },
  { k: "Languages",  v: "English" },
]

export default function BioSection() {
  const reveal = useReveal<HTMLElement>()

  return (
    <section
      ref={reveal}
      id="about"
      className="reveal-on-scroll border-t border-ink-200 bg-white px-6 py-24 md:px-12 md:py-[120px]"
    >
      <div className="mx-auto grid max-w-[1240px] gap-12 md:grid-cols-[360px_1fr] md:gap-[72px]">
        {/* Aside — sticky photo + facts */}
        <aside className="md:sticky md:top-[84px] md:self-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
            <Image
              src={images.about}
              alt="Gregg Pavitt"
              fill
              className="object-cover object-top"
            />
          </div>

          <dl className="mt-5 overflow-hidden rounded-md border border-ink-200 bg-ink-50">
            {FACTS.map((f, i) => (
              <div
                key={f.k}
                className={[
                  "grid grid-cols-[110px_1fr] gap-3.5 px-4 py-3 text-[13px]",
                  i < FACTS.length - 1 ? "border-b border-ink-200" : "",
                ].join(" ")}
              >
                <dt className="pt-0.5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-500">
                  {f.k}
                </dt>
                <dd className="m-0 font-medium tabular-nums text-ink-900">{f.v}</dd>
              </div>
            ))}
          </dl>
        </aside>

        {/* Body */}
        <div>
          <p className="eyebrow">About</p>
          <h2 className="mt-3 max-w-[24ch] text-[clamp(28px,3.2vw,44px)] font-semibold leading-[1.1] tracking-[-0.028em] text-ink-900">
            Reliable delivery in the toughest PFM environments.
          </h2>

          {/* All 4 paragraphs from content.ts — do not slice */}
          <div className="mt-7 space-y-4">
            {bio.paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-[1.7] text-ink-700">
                {p}
              </p>
            ))}
          </div>

          <blockquote className="mt-10 rounded-md border-l-4 border-ppf-sky bg-ppf-pale px-5 py-4">
            <p className="text-[17px] font-medium leading-[1.55] tracking-[-0.005em] text-ink-900">
              &ldquo;Gregg was the consummate professional consultant on my team&hellip;His advice was measured, clearly expressed and possessed both longer-term strategic vision for what could be possible and the short-term operational steps to be implemented immediately.&rdquo;
            </p>
            <footer className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-500">
              Project Director &middot; FCDO
            </footer>
          </blockquote>

          {/* LinkedIn quick link */}
          <a
            href={siteConfig.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-ppf-sky hover:text-ppf-blue"
          >
            Full profile on LinkedIn
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
