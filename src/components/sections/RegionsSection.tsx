// src/components/sections/RegionsSection.tsx  (v2 fintech — drop-in replacement)
//
// Header + current-engagement callout(s) + 2-column board:
//   • Left: existing <RegionsMap /> (react-simple-maps) in a muted panel
//   • Right: stacked region rows with country chips; Solomon Islands glows
//
// Maps over all currentCountries for the callout — safe when
// currentCountries grows beyond one entry.
"use client"
import { useTranslations } from "next-intl"
import { currentCountries, completedCountries, allCountries } from "@/lib/content"
import RegionsMap from "@/components/sections/RegionsMap"
import { useReveal } from "@/lib/useReveal"

type Country = (typeof completedCountries)[number]

function groupByRegion(countries: Country[]) {
  const order: Country["region"][] = ["Pacific", "Sub-Saharan Africa", "South Asia"]
  const groups: Record<string, Country[]> = {}
  for (const c of countries) (groups[c.region] ||= []).push(c)
  return order
    .filter((r) => groups[r]?.length)
    .map((r) => ({ region: r, items: groups[r] }))
}

export default function RegionsSection() {
  const t = useTranslations("Regions")
  const reveal = useReveal<HTMLElement>()
  const groups = groupByRegion(allCountries)

  return (
    <section
      ref={reveal}
      id="regions"
      className="reveal-on-scroll border-t border-ink-200 bg-white px-6 py-24 md:px-12 md:py-[120px]"
    >
      <div className="mx-auto max-w-[1240px]">
        {/* Head */}
        <div className="mb-12 grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end md:gap-12">
          <div>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="mt-3 max-w-[20ch] text-[clamp(28px,3.2vw,44px)] font-semibold leading-[1.1] tracking-[-0.028em] text-ink-900">
              {t("headline")}
            </h2>
          </div>

          {/* Current engagement callout — maps over all current countries */}
          {currentCountries.length > 0 && (
            <div className="flex flex-col gap-3">
              {currentCountries.map((country) => (
                <div
                  key={country.name}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-ink-200 bg-white px-5 py-4"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-success-bg px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-success-fg">
                    <span className="ppf-pulse h-[7px] w-[7px] rounded-full bg-success" />
                    {t("currentBadge")}
                  </span>
                  <div>
                    <div className="text-[17px] font-semibold tracking-[-0.01em] text-ink-900">
                      {country.name}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-500">
                      {t("ministry")}
                    </div>
                  </div>
                  {country.years && (
                    <span className="font-mono text-xs tabular-nums text-ink-500">
                      {country.years}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Board */}
        <div className="grid gap-0 overflow-hidden rounded-lg border border-ink-200 bg-white md:grid-cols-[1.4fr_1fr]">
          {/* Map */}
          <div className="flex min-h-[420px] items-center justify-center border-b border-ink-200 bg-ink-50 p-8 md:border-b-0 md:border-r">
            <div className="w-full">
              <RegionsMap />
            </div>
          </div>

          {/* List */}
          <div>
            {groups.map((g, i) => (
              <div
                key={g.region}
                className={[
                  "px-6 py-5",
                  i < groups.length - 1 ? "border-b border-ink-200" : "",
                ].join(" ")}
              >
                <div className="mb-2.5 flex items-baseline justify-between">
                  <h3 className="m-0 text-[12px] font-semibold uppercase tracking-[0.12em] text-ppf-blue">
                    {/* Region names live in messages so they translate but the
                        underlying region key stays English (used as a data
                        partition key). */}
                    {t(`regionNames.${g.region}` as `regionNames.${typeof g.region}`)}
                  </h3>
                  <span className="font-mono text-[11px] tabular-nums text-ink-500">
                    {String(g.items.length).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((c) => {
                    const isActive = currentCountries.some((cc) => cc.name === c.name)
                    return (
                      <span
                        key={c.name}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[13px]",
                          isActive
                            ? "border-success/25 bg-success-bg text-success-fg"
                            : "border-ink-200 bg-ink-50 text-ink-700",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            isActive ? "bg-success" : "bg-ink-400",
                          ].join(" ")}
                        />
                        {c.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
