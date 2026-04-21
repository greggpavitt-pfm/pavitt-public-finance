// src/components/sections/DonorsSection.tsx  (v2 fintech — drop-in replacement)
//
// 6-across logo strip, grayscale→color on hover, contained in a bordered card.
// Uses gap-px + container background to create dividers without conditional
// border logic (which caused stray borders at the sm breakpoint).
"use client"
import Image from "next/image"
import { donors } from "@/lib/content"
import { useReveal } from "@/lib/useReveal"

export default function DonorsSection() {
  const reveal = useReveal<HTMLElement>()

  return (
    <section
      ref={reveal}
      id="donors"
      className="reveal-on-scroll border-t border-ink-200 bg-ink-50 px-6 py-20 md:px-12 md:py-24"
    >
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Partners &amp; Donors</p>
            <h3 className="mt-2 max-w-[48ch] text-[clamp(22px,2.4vw,28px)] font-semibold leading-[1.25] tracking-[-0.02em] text-ink-900">
              Trusted by the agencies funding the world&rsquo;s hardest PFM reforms.
            </h3>
          </div>
          <span className="font-mono text-xs tabular-nums text-ink-500">
            {String(donors.length).padStart(2, "0")} agencies &middot; 15 programmes
          </span>
        </div>

        {/* gap-px + bg-ink-200 on the container creates the cell dividers without
            conditional border classes, which produce stray borders at breakpoints. */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 sm:grid-cols-3 lg:grid-cols-6">
          {donors.map((d) => (
            <div
              key={d.id}
              title={d.name}
              className="group flex h-[108px] items-center justify-center bg-white p-5 transition-colors hover:bg-ink-50"
            >
              <Image
                src={d.logo}
                alt={d.name}
                width={140}
                height={44}
                className="max-h-[44px] w-auto object-contain opacity-70 grayscale transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
