// src/components/sections/CasesSection.tsx  (v2 fintech — NEW section)
//
// Three case-study cards with image, region pill, title, summary, and a two-up
// metric footer. Case identifiers are kept in this file (with their image
// references); all human-readable text — tag, years, title, description, and
// metric labels — lives in messages/<locale>.json so the cases translate.
//
// Cards carry reveal-on-scroll + data-delay in JSX so useRevealChildren
// doesn't need to add them imperatively (avoids visible→invisible FOUC).
"use client"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { images } from "@/lib/content"
import { useRevealChildren } from "@/lib/useReveal"

// Static structure for the three current case studies. Each entry maps to
// a key under messages.Cases.items.<id>. To add a fourth case study: add
// a row here and a matching block in messages/en.json, then re-run the
// translate script.
const CASES = [
  { id: "fsm",    image: images.ipsasPpf,  metric1Pos: true, metric2Pos: false },
  { id: "eu-drm", image: images.ssaAccounting, metric1Pos: true, metric2Pos: false },
  { id: "ifmis", image: images.ifmis,      metric1Pos: true, metric2Pos: false },
] as const

export default function CasesSection() {
  const t = useTranslations("Cases")
  const gridRef = useRevealChildren<HTMLDivElement>()

  return (
    <section
      id="cases"
      className="border-t border-ink-200 bg-white px-6 py-24 md:px-12 md:py-[120px]"
    >
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="mt-3 text-[clamp(28px,3.2vw,44px)] font-semibold leading-[1.1] tracking-[-0.028em] text-ink-900">
              {t("headline")}
            </h2>
          </div>
          <span className="hidden font-mono text-[11px] tabular-nums tracking-[0.08em] text-ink-500 sm:block">
            {t("countSuffix")}
          </span>
        </div>

        <div ref={gridRef} className="grid gap-4 md:grid-cols-3">
          {CASES.map((c, i) => {
            const tag    = t(`items.${c.id}.tag` as `items.${typeof c.id}.tag`)
            const years  = t(`items.${c.id}.years` as `items.${typeof c.id}.years`)
            const title  = t(`items.${c.id}.title` as `items.${typeof c.id}.title`)
            const desc   = t(`items.${c.id}.desc` as `items.${typeof c.id}.desc`)
            const m1Lbl  = t(`items.${c.id}.metric1Label` as `items.${typeof c.id}.metric1Label`)
            const m1Val  = t(`items.${c.id}.metric1Value` as `items.${typeof c.id}.metric1Value`)
            const m2Lbl  = t(`items.${c.id}.metric2Label` as `items.${typeof c.id}.metric2Label`)
            const m2Val  = t(`items.${c.id}.metric2Value` as `items.${typeof c.id}.metric2Value`)
            return (
              <article
                key={c.id}
                className="reveal-on-scroll group flex flex-col overflow-hidden rounded-lg border border-ink-200 bg-white transition-all duration-200 hover:-translate-y-px hover:border-ppf-sky hover:shadow-crisp-md"
                data-delay={String(Math.min(i + 1, 5))}
              >
                <div className="relative aspect-[16/10] bg-ink-100">
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-[400ms] group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-1 flex-col px-5 py-5">
                  <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-500">
                    <span className="rounded-sm bg-ppf-light px-2 py-0.5 font-medium tracking-[0.08em] text-ppf-blue">
                      {tag}
                    </span>
                    <span className="tabular-nums">{years}</span>
                  </div>
                  <h3 className="mt-2.5 text-[17px] font-semibold leading-[1.3] tracking-[-0.012em] text-ink-900">
                    {title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-[1.55] text-ink-700">
                    {desc}
                  </p>
                  <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-ink-200 pt-3.5">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-ink-500">
                        {m1Lbl}
                      </div>
                      <div
                        className={[
                          "mt-0.5 text-lg font-semibold tabular-nums tracking-[-0.018em]",
                          c.metric1Pos ? "text-success" : "text-ink-900",
                        ].join(" ")}
                      >
                        {m1Val}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-ink-500">
                        {m2Lbl}
                      </div>
                      <div
                        className={[
                          "mt-0.5 text-lg font-semibold tabular-nums tracking-[-0.018em]",
                          c.metric2Pos ? "text-success" : "text-ink-900",
                        ].join(" ")}
                      >
                        {m2Val}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
