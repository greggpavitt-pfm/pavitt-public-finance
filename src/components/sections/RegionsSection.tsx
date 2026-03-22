// Regions section — map + country lists, grouped by region
// Solomon Islands is highlighted as the current engagement
import { currentCountries, completedCountries } from "@/lib/content"
import RegionsMap from "@/components/sections/RegionsMap"

// Group countries by region for display
function groupByRegion(countries: typeof completedCountries) {
  const groups: Record<string, string[]> = {}
  for (const country of countries) {
    if (!groups[country.region]) {
      groups[country.region] = []
    }
    groups[country.region].push(country.name)
  }
  return groups
}

export default function RegionsSection() {
  const completedGroups = groupByRegion(completedCountries)

  return (
    <section id="regions" className="bg-white px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        {/* Section label */}
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-ppf-blue">
          Global Reach
        </p>
        <h2 className="mb-12 text-3xl font-bold text-ppf-navy md:text-4xl">
          Countries &amp; Regions Served
        </h2>

        {/* Interactive map */}
        <div className="mb-14">
          <RegionsMap />
        </div>

        {/* Current engagement callout — brand blue accent */}
        {currentCountries.map((country) => (
          <div
            key={country.name}
            className="mb-12 flex items-center gap-4 rounded-lg border-l-4 border-ppf-sky bg-ppf-light px-6 py-5"
          >
            <div>
              <span className="inline-block rounded-full bg-ppf-sky px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {country.badge}
              </span>
              <p className="mt-2 text-xl font-semibold text-ppf-navy">
                {country.name}
              </p>
              {country.years && (
                <p className="text-sm text-slate-600">{country.years}</p>
              )}
            </div>
          </div>
        ))}

        {/* Completed engagements by region */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {Object.entries(completedGroups).map(([region, names]) => (
            <div key={region}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-ppf-blue">
                {region}
              </h3>
              <ul className="space-y-2">
                {names.map((name) => (
                  <li key={name} className="text-base text-slate-700">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
