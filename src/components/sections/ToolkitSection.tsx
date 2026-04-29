// src/components/sections/ToolkitSection.tsx  (v2 fintech — NEW section)
//
// Dark, navy panel previewing the practitioner toolkit (advisor + training).
// Links to the two existing app routes: /advisor and /ipsas-training.
"use client"
import Link from "next/link"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { useReveal } from "@/lib/useReveal"

const TABS = ["advisor", "training", "tools"] as const
type TabId = (typeof TABS)[number]

// Pseudo-code body for each tab — kept in English on purpose. These are
// stylised "code-themed" mockups (terminal output, inline keywords); they
// read more like a screenshot than prose, so translating them would lose
// the visual effect. The eyebrow/title/body of each side card and the tab
// labels themselves DO translate (those are user-facing copy).
const BODIES: Record<
  TabId,
  { lines: Array<{ num: number; parts: Array<{ t: string; c?: "k" | "s" | "c" }> }> }
> = {
  advisor: {
    lines: [
      { num: 1, parts: [{ t: "# Query", c: "c" }] },
      { num: 2, parts: [{ t: "recognise", c: "k" }, { t: " revenue from ", c: "c" as const }, { t: "'grants", c: "s" }, { t: "'", c: "s" }] },
      { num: 3, parts: [{ t: "  where ", c: "c" }, { t: "basis", c: "k" }, { t: " = ", c: "c" }, { t: "'cash'", c: "s" }] },
      { num: 4, parts: [{ t: "→ IPSAS 23 · paragraph 28", c: "c" }] },
      { num: 5, parts: [{ t: "  inflow of resource, no exchange", c: "c" }] },
      { num: 6, parts: [{ t: "→ see related: ", c: "c" }, { t: "IPSAS 1, 9, 19", c: "k" }] },
    ],
  },
  training: {
    lines: [
      { num: 1, parts: [{ t: "module", c: "k" }, { t: " 04 · Accrual Transition", c: "c" }] },
      { num: 2, parts: [{ t: "  status:  ", c: "c" }, { t: "published", c: "s" }] },
      { num: 3, parts: [{ t: "  lessons: 6 · quizzes: 14", c: "c" }] },
      { num: 4, parts: [{ t: "  avg. pass rate: ", c: "c" }, { t: "88%", c: "s" }] },
      { num: 5, parts: [{ t: "next", c: "k" }, { t: " → ", c: "c" }, { t: "Opening balances & CoA", c: "s" }] },
    ],
  },
  tools: {
    lines: [
      { num: 1, parts: [{ t: "// PEFA assessment template", c: "c" }] },
      { num: 2, parts: [{ t: "indicator", c: "k" }, { t: " PI-21 · predictability", c: "c" }] },
      { num: 3, parts: [{ t: "  score: ", c: "c" }, { t: "B+", c: "s" }] },
      { num: 4, parts: [{ t: "  evidence:  12 docs, 4 interviews", c: "c" }] },
      { num: 5, parts: [{ t: "export", c: "k" }, { t: " → ", c: "c" }, { t: "PEFA-21-SLB.pdf", c: "s" }] },
    ],
  },
}

export default function ToolkitSection() {
  const t = useTranslations("Toolkit")
  const reveal = useReveal<HTMLElement>()
  const [tab, setTab] = useState<TabId>("advisor")
  const body = BODIES[tab]

  const color = (c?: "k" | "s" | "c") =>
    c === "k" ? "text-ppf-sky"
    : c === "s" ? "text-[#c3e4a6]"
    : c === "c" ? "text-white/40"
    : "text-white/85"

  return (
    <section
      ref={reveal}
      id="toolkit"
      className="reveal-on-scroll relative overflow-hidden border-t border-ink-200 bg-ppf-navy px-6 py-24 md:px-12 md:py-[120px]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 100% 0%, rgba(31,127,207,0.35), transparent 55%)",
        }}
      />

      <div className="relative z-[1] mx-auto max-w-[1240px]">
        <div className="on-dark mb-10 max-w-[640px]">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-3 text-[clamp(28px,3.2vw,44px)] font-semibold leading-[1.1] tracking-[-0.028em] text-white">
            {t("headline")}
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-white/70">
            {t("lead")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          {/* Main — tabbed terminal */}
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <div className="flex border-b border-white/10">
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={[
                    "px-4 py-3.5 text-[13px] font-medium transition-colors",
                    id === tab
                      ? "border-b-2 border-ppf-sky text-white"
                      : "text-white/60 hover:text-white/85",
                  ].join(" ")}
                >
                  {t(`tabs.${id}` as `tabs.${typeof id}`)}
                </button>
              ))}
            </div>
            <pre className="m-0 overflow-x-auto p-6 font-mono text-[12px] leading-[1.7] text-white/85 sm:text-[13px]">
              {body.lines.map((line) => (
                <div key={line.num} className="flex items-baseline gap-3 tabular-nums">
                  <span className="w-[22px] shrink-0 text-right text-white/30">
                    {String(line.num).padStart(2, "0")}
                  </span>
                  <span>
                    {line.parts.map((p, i) => (
                      <span key={i} className={color(p.c)}>{p.t}</span>
                    ))}
                  </span>
                </div>
              ))}
            </pre>
          </div>

          {/* Side — two cards (Desk, Drills) plus a small pricing link below */}
          <div className="grid gap-3">
            <Link
              href="/desk"
              className="rounded-lg border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-ppf-sky/60 hover:bg-white/[0.06]"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ppf-sky">
                {t("deskCard.eyebrow")}
              </div>
              <div className="mt-1.5 text-base font-semibold tracking-[-0.01em] text-white">
                {t("deskCard.title")}
              </div>
              <div className="mt-1.5 text-[13px] leading-[1.55] text-white/70">
                {t("deskCard.body")}
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-white/10 pt-3.5">
                <div>
                  <div className="font-semibold tabular-nums text-[22px] tracking-[-0.02em] text-white">
                    {t("deskCard.metric")}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.08em] text-white/50">
                    {t("deskCard.metricLabel")}
                  </div>
                </div>
                <span aria-hidden className="text-white/60">→</span>
              </div>
            </Link>

            <Link
              href="/drills"
              className="rounded-lg border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-ppf-sky/60 hover:bg-white/[0.06]"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ppf-sky">
                {t("drillsCard.eyebrow")}
              </div>
              <div className="mt-1.5 text-base font-semibold tracking-[-0.01em] text-white">
                {t("drillsCard.title")}
              </div>
              <div className="mt-1.5 text-[13px] leading-[1.55] text-white/70">
                {t("drillsCard.body")}
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-white/10 pt-3.5">
                <div>
                  <div className="font-semibold tabular-nums text-[22px] tracking-[-0.02em] text-white">
                    {t("drillsCard.metric")}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.08em] text-white/50">
                    {t("drillsCard.metricLabel")}
                  </div>
                </div>
                <span aria-hidden className="text-white/60">→</span>
              </div>
            </Link>

            <Link
              href="/pricing"
              className="rounded-lg border border-ppf-sky/30 bg-ppf-sky/10 px-5 py-3 text-center text-[13px] font-medium text-white transition-colors hover:bg-ppf-sky/20"
            >
              {t("pricingLink")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
