// src/components/sections/CasesSection.tsx  (v2 fintech — NEW section)
//
// Three case-study cards with image, region pill, title, summary, and a two-up
// metric footer. Content is inline — lift into src/lib/content.ts as
// `export const cases: CaseStudy[]` once copy is approved.
//
// Cards carry reveal-on-scroll + data-delay in JSX so useRevealChildren
// doesn't need to add them imperatively (avoids visible→invisible FOUC).
"use client"
import Image from "next/image"
import { images } from "@/lib/content"
import { useRevealChildren } from "@/lib/useReveal"

type CaseStudy = {
  id: string
  tag: string
  years: string
  title: string
  desc: string
  image: string
  metrics: [{ label: string; value: string; pos?: boolean }, { label: string; value: string; pos?: boolean }]
}

const CASES: CaseStudy[] = [
  {
    id: "fsm",
    tag: "Solomon Islands · Pacific",
    years: "2024–Present",
    title: "Creating and Deploying IPSAS based Reporting System",
    desc: "Developing custom IPSAS reporting system. Modifying secondary chart of accounts, automating power pivot production system for multi-year reporting of governmental, donor, and special purpose funds.",
    image: images.ipsasAcctg,
    metrics: [
      { label: "IPSAS Coverage", value: "94%", pos: true },
      { label: "Staff Trained", value: "48" },
    ],
  },
  {
    id: "eu-drm",
    tag: "Sub-Saharan Africa",
    years: "2018–2021",
    title: "Domestic revenue mobilisation diagnostic",
    desc: "Led a multi-country PEFA-style assessment for EuropeAid covering tax policy, administration capacity, and taxpayer compliance across three SSA jurisdictions.",
    image: images.drm,
    metrics: [
      { label: "Revenue Gap Closed", value: "+2.3pp", pos: true },
      { label: "Countries", value: "3" },
    ],
  },
  {
    id: "ifmis",
    tag: "FSM · Pacific",
    years: "2021–2024",
    title: "IFMIS design and operationalisation",
    desc: "Design and procure a resilient IFMIS to modernize public financial management, ensure GAAP compliance, and maximize transparency across island operations. Coordinated for individual island states and national government.",
    image: images.ifmis,
    metrics: [
      { label: "Go-Live On Time", value: "Yes", pos: true },
      { label: "Ministries Onboarded", value: "12" },
    ],
  },
]

export default function CasesSection() {
  const gridRef = useRevealChildren<HTMLDivElement>()

  return (
    <section
      id="cases"
      className="border-t border-ink-200 bg-white px-6 py-24 md:px-12 md:py-[120px]"
    >
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Selected Work</p>
            <h2 className="mt-3 text-[clamp(28px,3.2vw,44px)] font-semibold leading-[1.1] tracking-[-0.028em] text-ink-900">
              Reform programmes that shipped.
            </h2>
          </div>
          <span className="hidden font-mono text-[11px] tabular-nums tracking-[0.08em] text-ink-500 sm:block">
            3 of 15 engagements
          </span>
        </div>

        <div ref={gridRef} className="grid gap-4 md:grid-cols-3">
          {CASES.map((c, i) => (
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
                    {c.tag}
                  </span>
                  <span className="tabular-nums">{c.years}</span>
                </div>
                <h3 className="mt-2.5 text-[17px] font-semibold leading-[1.3] tracking-[-0.012em] text-ink-900">
                  {c.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-[1.55] text-ink-700">
                  {c.desc}
                </p>
                <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-ink-200 pt-3.5">
                  {c.metrics.map((m) => (
                    <div key={m.label}>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-ink-500">
                        {m.label}
                      </div>
                      <div
                        className={[
                          "mt-0.5 text-lg font-semibold tabular-nums tracking-[-0.018em]",
                          m.pos ? "text-success" : "text-ink-900",
                        ].join(" ")}
                      >
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
