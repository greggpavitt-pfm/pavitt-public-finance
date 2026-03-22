// Expertise section — 6 PFM areas displayed as large cards
import { expertiseAreas } from "@/lib/content"

export default function ExpertiseSection() {
  return (
    <section id="expertise" className="bg-ppf-navy px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        {/* Section label */}
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-ppf-sky">
          Areas of Expertise
        </p>
        <h2 className="mb-12 text-3xl font-bold text-white md:text-4xl">
          Public Financial Management Services
        </h2>

        {/* 3-column grid on desktop, 1-column on mobile */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {expertiseAreas.map((area) => (
            <div
              key={area.id}
              className="rounded-lg border border-ppf-blue/30 bg-ppf-blue/10 p-8 transition-colors hover:border-ppf-sky"
            >
              {/* Short label (e.g. "PIM") */}
              <p className="mb-2 text-3xl font-bold text-ppf-sky">{area.label}</p>
              {/* Full name */}
              <h3 className="mb-4 text-lg font-semibold text-white">{area.fullName}</h3>
              {/* Description */}
              <p className="text-sm leading-relaxed text-blue-200/80">{area.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
