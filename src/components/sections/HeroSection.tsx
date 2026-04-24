"use client"
// src/components/sections/HeroSection.tsx  (v2 fintech — drop-in replacement)
//
// Full-bleed navy hero with:
//   • Left: live status kicker, display headline, lead, dual CTAs, donor strip
//   • Right: photo card with caption meta (needs its own ref — one useReveal
//     instance can only observe one element)
//   • Bottom: 4-up stat bar (years · countries · donors · PFM domains)

import Image from "next/image"
import Link from "next/link"
import { siteConfig, images, donors, completedCountries, currentCountries, expertiseAreas } from "@/lib/content"
import { useReveal } from "@/lib/useReveal"

const HERO_COPY = {
  kicker: "Currently engaged · Solomon Islands",
  headlineLead: "Public financial reform that",
  headlineAccent: "outlasts the project cycle.",
  lead:
    "Gregg Pavitt has led PFM reform for Ministries of Finance across 15 countries — designing the systems, building the capacity, and delivering the assessments donors rely on.",
  primaryCta: { label: "Discuss an engagement", href: "/#contact" },
  secondaryCta: { label: "See expertise areas", href: "/#expertise" },
  heroCardCaption: "FIELD · HONIARA",
  heroCardTitle: "Ministry of Finance & Treasury",
  heroCardTag: "2024 — present",
}

export default function HeroSection() {
  const revealLeft = useReveal<HTMLDivElement>()
  const revealRight = useReveal<HTMLDivElement>()

  const totalCountries = currentCountries.length + completedCountries.length
  const stats: Array<{ value: string; suffix?: string; label: string }> = [
    { value: "25", suffix: "+", label: "Years in PFM" },
    { value: String(totalCountries), label: "Countries served" },
    { value: String(donors.length), label: "Donor agencies" },
    // Derived from expertiseAreas in content.ts — not a fabricated marketing claim
    { value: String(expertiseAreas.length), label: "PFM domains" },
  ]

  return (
    <section className="relative overflow-hidden bg-ppf-navy pt-[140px] text-white">
      {/* Radial glow backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 85% -10%, rgba(31,127,207,0.35), transparent 55%), radial-gradient(ellipse at -10% 110%, rgba(10,106,185,0.28), transparent 55%)",
        }}
      />
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent, #000 15%, #000 60%, transparent 100%)",
          maskImage:
            "linear-gradient(180deg, transparent, #000 15%, #000 60%, transparent 100%)",
        }}
      />

      <div className="relative z-[2] mx-auto grid max-w-[1240px] gap-14 px-6 md:grid-cols-[1.05fr_0.95fr] md:gap-[72px] md:px-12">
        {/* LEFT — headline + CTAs */}
        <div ref={revealLeft} className="reveal-on-scroll pb-14 md:pb-[72px]">
          {/* Live-status kicker */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[12px]">
            <span className="ppf-pulse h-[7px] w-[7px] rounded-full bg-[#4ADE80]" />
            <span className="font-mono text-[11px] tracking-wide text-white/85">
              {HERO_COPY.kicker}
            </span>
          </div>

          <h1 className="max-w-[14ch] text-[clamp(40px,5.6vw,68px)] font-semibold leading-[1.02] tracking-[-0.035em] text-white">
            {HERO_COPY.headlineLead}{" "}
            <span className="text-ppf-sky">{HERO_COPY.headlineAccent}</span>
          </h1>

          <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.6] text-white/80">
            {HERO_COPY.lead}
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <Link
              href={HERO_COPY.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-md bg-ppf-sky px-[18px] py-[11px] text-sm font-medium text-white shadow-crisp-sm transition-all hover:bg-ppf-sky-hover hover:shadow-crisp-md"
            >
              {HERO_COPY.primaryCta.label}
              <span aria-hidden>→</span>
            </Link>
            <Link
              href={HERO_COPY.secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-transparent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/35 hover:bg-white/[0.06]"
            >
              {HERO_COPY.secondaryCta.label}
            </Link>
          </div>

          {/* Donor trust strip */}
          <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/50">
              Worked with
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {donors.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className="flex h-[40px] items-center justify-center rounded bg-white/90 px-3"
                  title={d.name}
                >
                  <Image
                    src={d.logo}
                    alt={d.name}
                    width={100}
                    height={28}
                    className="h-[28px] w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — photo card (needs its own ref; a ref can only bind one node) */}
        <div ref={revealRight} className="reveal-on-scroll pb-14 md:pb-[72px]" data-delay="2">
          <div
            className="relative mx-auto aspect-[4/5] max-w-[640px] overflow-hidden rounded-xl bg-ppf-navy-deep"
            style={{
              boxShadow:
                "0 40px 80px -40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            <Image
              src={images.hero}
              alt="Gregg Pavitt — fieldwork"
              fill
              priority
              className="object-cover object-top"
            />
            {/* Bottom scrim */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 40%, rgba(5,28,90,0.85) 100%)",
              }}
            />
            {/* Caption */}
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 text-white">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/70">
                  {HERO_COPY.heroCardCaption}
                </p>
                <p className="mt-1 text-base font-semibold tracking-tight">
                  {HERO_COPY.heroCardTitle}
                </p>
              </div>
              <span className="rounded-sm bg-white/15 px-2 py-1 font-mono text-[10.5px] tracking-wide text-white/90">
                {HERO_COPY.heroCardTag}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS bar */}
      <div className="relative z-[2] border-t border-white/10 bg-ppf-navy-deep">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 px-6 sm:grid-cols-4 md:px-12">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={[
                "px-5 py-7 sm:px-7",
                i > 0 ? "sm:border-l sm:border-white/10" : "",
                i >= 2 ? "border-t border-white/10 sm:border-t-0" : "",
              ].join(" ")}
            >
              <div className="flex items-baseline gap-1 font-semibold tabular-nums tracking-[-0.035em] text-white">
                <span className="text-[44px] leading-none">{s.value}</span>
                {s.suffix && (
                  <span className="text-[28px] text-ppf-sky">{s.suffix}</span>
                )}
              </div>
              <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-white/55">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">{siteConfig.tagline}</span>
    </section>
  )
}
