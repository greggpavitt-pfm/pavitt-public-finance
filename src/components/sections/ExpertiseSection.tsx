// src/components/sections/ExpertiseSection.tsx  (v2 fintech — drop-in replacement)
//
// Light-slate background, 3×2 grid of cards. Each card links to #contact
// so the "Learn more →" affordance is honest (no dead click).
// Cards carry reveal-on-scroll + data-delay in JSX so useRevealChildren
// doesn't need to add them imperatively (avoids visible→invisible FOUC).
"use client"
import Link from "next/link"
import { expertiseAreas } from "@/lib/content"
import { useRevealChildren } from "@/lib/useReveal"

export default function ExpertiseSection() {
  const gridRef = useRevealChildren<HTMLDivElement>()

  return (
    <section
      id="expertise"
      className="border-t border-ink-200 bg-ink-50 px-6 py-24 md:px-12 md:py-[120px]"
    >
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-10 flex max-w-[800px] items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Areas of Expertise</p>
            <h2 className="mt-3 text-[clamp(28px,3.2vw,44px)] font-semibold leading-[1.1] tracking-[-0.028em] text-ink-900">
              Six reform tracks, one integrated practice.
            </h2>
          </div>
          <span className="hidden shrink-0 font-mono text-[11px] tabular-nums tracking-[0.08em] text-ink-500 md:block">
            {String(expertiseAreas.length).padStart(2, "0")} tracks
          </span>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {expertiseAreas.map((area, i) => (
            // Cards link to #contact — "interested in this area? get in touch"
            <Link
              key={area.id}
              href="/#contact"
              className={[
                "reveal-on-scroll",
                "group flex min-h-[240px] flex-col rounded-lg border border-ink-200 bg-white p-6",
                "transition-all duration-200 hover:-translate-y-px hover:border-ppf-sky hover:shadow-crisp-md",
              ].join(" ")}
              data-delay={String(Math.min(i + 1, 5))}
            >
              <div className="font-mono text-[11px] tabular-nums tracking-[0.08em] text-ink-400">
                {String(i + 1).padStart(2, "0")} / {String(expertiseAreas.length).padStart(2, "0")}
              </div>
              <div className="mt-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-ppf-sky">
                {area.label}
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-[1.25] tracking-[-0.01em] text-ink-900">
                {area.fullName}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-[1.55] text-ink-700">
                {area.description}
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-ppf-sky">
                Learn more <span aria-hidden>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
