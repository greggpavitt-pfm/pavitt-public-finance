// Donors section — logos of international development agencies
import Image from "next/image"
import { donors } from "@/lib/content"

export default function DonorsSection() {
  return (
    <section id="donors" className="bg-ppf-pale px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        {/* Section label */}
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-ppf-blue">
          Partners &amp; Donors
        </p>
        <h2 className="mb-12 text-3xl font-bold text-ppf-navy md:text-4xl">
          Trusted by Leading Development Agencies
        </h2>

        {/* Logo grid — wraps on smaller screens */}
        <div className="flex flex-wrap items-center justify-center gap-10 md:justify-start">
          {donors.map((donor) => (
            <div
              key={donor.id}
              className="flex h-20 w-40 items-center justify-center grayscale transition-all hover:grayscale-0"
              title={donor.name}
            >
              <Image
                src={donor.logo}
                alt={donor.name}
                width={140}
                height={70}
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
