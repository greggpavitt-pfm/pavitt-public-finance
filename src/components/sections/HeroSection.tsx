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
import { useTranslations } from "next-intl"
import { images, donors, completedCountries, currentCountries, expertiseAreas } from "@/lib/content"
import { useReveal } from "@/lib/useReveal"

export default function HeroSection() {
  const t = useTranslations("Hero")
  const tBio = useTranslations("Bio")
  const tDonors = useTranslations("Donors")

  const revealLeft = useReveal<HTMLDivElement>()
  const revealRight = useReveal<HTMLDivElement>()

  const totalCountries = currentCountries.length + completedCountries.length
  const stats: Array<{ value: string; suffix?: string; label: string }> = [
    { value: "25", suffix: "+", label: t("stats.yearsLabel") },
    { value: String(totalCountries), label: t("stats.countriesLabel") },
    { value: String(donors.length), label: t("stats.donorsLabel") },
    // Derived from expertiseAreas in content.ts — not a fabricated marketing claim
    { value: String(expertiseAreas.length), label: t("stats.domainsLabel") },
  ]

  return (
    <>
      {/* ── MOBILE HERO (< 768px) ── */}
      <div className="md:hidden bg-ppf-navy text-white">
        {/* Compact row: avatar + name/title */}
        <div className="flex items-center gap-4 px-5 pt-20 pb-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-ppf-sky flex items-center justify-center text-white font-bold text-lg">
            GP
          </div>
          <div>
            <p className="text-base font-bold leading-tight">{t("mobile.name")}</p>
            <p className="text-xs text-blue-300">{t("mobile.title")}</p>
            <p className="text-xs text-blue-200 mt-0.5">{t("mobile.regions")}</p>
          </div>
        </div>

        {/* Stat strip */}
        <div className="flex justify-around bg-ppf-navy-deep px-4 py-3 border-t border-white/10">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-base font-bold text-white tabular-nums">
                {s.value}{s.suffix ?? ""}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-white/55 font-mono">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-5 py-4">
          <a
            href="/#contact"
            className="block w-full rounded-md bg-ppf-sky py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-ppf-sky-hover"
          >
            {t("mobile.getInTouch")}
          </a>
        </div>

        {/* Two ways to work — mobile (stacked) */}
        <div className="border-t border-white/10 bg-ppf-navy-deep px-5 py-6">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ppf-sky">
            {t("twoWays.eyebrow")}
          </p>
          <h2 className="mt-2 text-[20px] font-semibold leading-[1.2] tracking-[-0.02em] text-white">
            {t("twoWays.headline")}
          </h2>

          {/* Engage Gregg directly */}
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-white">
              {t("twoWays.consultTitle")}
            </h3>
            <p className="mt-2 text-[13px] leading-[1.55] text-white/75">
              {t("twoWays.consultBody")}
            </p>
            <Link
              href="/#contact"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-ppf-sky-hover"
            >
              {t("twoWays.consultCta")} <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Use the toolkit */}
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-white">
              {t("twoWays.toolkitTitle")}
            </h3>
            <p className="mt-2 text-[13px] leading-[1.55] text-white/75">
              {t("twoWays.toolkitBody")}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/drills"
                className="rounded-md bg-ppf-sky px-4 py-2 text-center text-[13px] font-medium text-white transition-colors hover:bg-ppf-sky-hover"
              >
                {t("twoWays.toolkitDrills")} →
              </Link>
              <Link
                href="/desk"
                className="rounded-md bg-[#2A8FE0] px-4 py-2 text-center text-[13px] font-medium text-white transition-colors hover:bg-[#3B9AE1]"
              >
                {t("twoWays.toolkitDesk")} →
              </Link>
              <Link
                href="/pricing"
                className="text-center text-[12px] font-medium text-ppf-sky underline-offset-2 hover:underline"
              >
                {t("twoWays.toolkitPricing")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── DESKTOP HERO (≥ 768px) ── */}
      <section className="relative overflow-hidden bg-ppf-navy pt-[140px] text-white hidden md:block">
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

      <div className="relative z-[2] mx-auto max-w-[1240px] px-6 md:px-12">
        {/* TOP — full-width slogan band */}
        <div ref={revealLeft} className="reveal-on-scroll">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[12px]">
            <span className="ppf-pulse h-[7px] w-[7px] rounded-full bg-[#4ADE80]" />
            <span className="font-mono text-[11px] tracking-wide text-white/85">
              {t("kicker")}
            </span>
          </div>

          {/* Headline goes full-width across the top of the fold so the slogan
              reads as the page's primary statement, not a left-column heading. */}
          <h1 className="mt-6 max-w-[26ch] text-[clamp(40px,6.4vw,80px)] font-semibold leading-[1.02] tracking-[-0.035em] text-white">
            {t("headlineLead")}{" "}
            <span className="text-ppf-sky">{t("headlineAccent")}</span>
          </h1>
        </div>

        {/* BELOW — 2-col: lead + CTAs on left, smaller photo on right */}
        <div className="mt-10 grid gap-10 pb-14 md:grid-cols-[1.4fr_0.85fr] md:gap-[64px] md:pb-[72px]">
          {/* LEFT — lead + 3 CTAs (Discuss + Drills + Desk) + donor strip */}
          <div>
            <p className="max-w-[56ch] text-[17px] leading-[1.6] text-white/80">
              {t("lead")}
            </p>

            {/* Three CTAs in the top fold so toolkit offer is explicit on first
                paint. Discuss = consulting (primary); Drills + Desk = SaaS toolkit. */}
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link
                href="/#contact"
                className="inline-flex items-center gap-2 rounded-md bg-ppf-sky px-[18px] py-[11px] text-sm font-medium text-white shadow-crisp-sm transition-all hover:bg-ppf-sky-hover hover:shadow-crisp-md"
              >
                {t("primaryCta")}
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/drills"
                className="inline-flex items-center gap-2 rounded-md bg-ppf-sky px-[18px] py-[11px] text-sm font-medium text-white shadow-crisp-sm transition-all hover:bg-ppf-sky-hover hover:shadow-crisp-md"
              >
                {t("drillsCta")}
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/desk"
                className="inline-flex items-center gap-2 rounded-md bg-[#2A8FE0] px-[18px] py-[11px] text-sm font-medium text-white shadow-crisp-sm transition-all hover:bg-[#3B9AE1] hover:shadow-crisp-md"
              >
                {t("deskCta")}
                <span aria-hidden>→</span>
              </Link>
            </div>

            <Link
              href="/#expertise"
              className="mt-3 inline-block text-[13px] font-medium text-ppf-sky underline-offset-2 hover:underline"
            >
              {t("expertiseLink")}
            </Link>

            {/* Donor trust strip */}
            <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/50">
                {t("workedWith")}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {donors.slice(0, 5).map((d) => {
                  const name = tDonors(`names.${d.id}` as `names.${typeof d.id}`)
                  return (
                    <div
                      key={d.id}
                      className="flex h-[40px] items-center justify-center rounded bg-white/90 px-3"
                      title={name}
                    >
                      <Image
                        src={d.logo}
                        alt={name}
                        width={100}
                        height={28}
                        className="h-[28px] w-auto object-contain"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — photo card. Reduced from max-w-[640px]/aspect-[4/5] to
              max-w-[420px]/aspect-[3/4] so the slogan stays dominant. */}
          <div ref={revealRight} className="reveal-on-scroll" data-delay="2">
            <div
              className="relative mx-auto aspect-[3/4] max-w-[420px] overflow-hidden rounded-xl bg-ppf-navy-deep"
              style={{
                boxShadow:
                  "0 40px 80px -40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
              }}
            >
              <Image
                src={images.hero}
                alt={t("mobile.name")}
                fill
                priority
                className="object-cover object-top"
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 40%, rgba(5,28,90,0.85) 100%)",
                }}
              />
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 text-white">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/70">
                    {t("card.caption")}
                  </p>
                  <p className="mt-1 text-base font-semibold tracking-tight">
                    {t("card.title")}
                  </p>
                </div>
                <span className="rounded-sm bg-white/15 px-2 py-1 font-mono text-[10.5px] tracking-wide text-white/90">
                  {t("card.tag")}
                </span>
              </div>
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

      {/* SECOND HERO BAND — Two ways to work with us (desktop) */}
      <div className="relative z-[2] border-t border-white/10 bg-ppf-navy-deep px-6 py-14 md:px-12 md:py-20">
        <div className="mx-auto max-w-[1240px]">
          <div className="max-w-[680px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ppf-sky">
              {t("twoWays.eyebrow")}
            </p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-white">
              {t("twoWays.headline")}
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {/* Left card — Engage Gregg directly */}
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-7 transition-colors hover:border-ppf-sky/40 hover:bg-white/[0.06]">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ppf-sky">
                {t("twoWays.consultEyebrow")}
              </p>
              <h3 className="mt-2.5 text-[22px] font-semibold tracking-[-0.015em] text-white">
                {t("twoWays.consultTitle")}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.65] text-white/80">
                {t("twoWays.consultBody")}
              </p>
              <Link
                href="/#contact"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-[18px] py-[11px] text-sm font-medium text-white shadow-crisp-sm transition-all hover:bg-ppf-sky-hover hover:shadow-crisp-md"
              >
                {t("twoWays.consultCta")}
                <span aria-hidden>→</span>
              </Link>
            </div>

            {/* Right card — Use the toolkit */}
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-7 transition-colors hover:border-ppf-sky/40 hover:bg-white/[0.06]">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ppf-sky">
                {t("twoWays.toolkitEyebrow")}
              </p>
              <h3 className="mt-2.5 text-[22px] font-semibold tracking-[-0.015em] text-white">
                {t("twoWays.toolkitTitle")}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.65] text-white/80">
                {t("twoWays.toolkitBody")}
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  href="/drills"
                  className="inline-flex items-center gap-2 rounded-md bg-ppf-sky px-[18px] py-[11px] text-sm font-medium text-white shadow-crisp-sm transition-all hover:bg-ppf-sky-hover hover:shadow-crisp-md"
                >
                  {t("twoWays.toolkitDrills")}
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/desk"
                  className="inline-flex items-center gap-2 rounded-md bg-[#2A8FE0] px-[18px] py-[11px] text-sm font-medium text-white shadow-crisp-sm transition-all hover:bg-[#3B9AE1] hover:shadow-crisp-md"
                >
                  {t("twoWays.toolkitDesk")}
                  <span aria-hidden>→</span>
                </Link>
              </div>
              <Link
                href="/pricing"
                className="mt-4 inline-block text-[13px] font-medium text-ppf-sky underline-offset-2 hover:underline"
              >
                {t("twoWays.toolkitPricing")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">{tBio("tagline")}</span>
    </section>
    </>
  )
}
