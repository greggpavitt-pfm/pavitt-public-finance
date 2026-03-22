// Bio section — headshot + two bio paragraphs side by side
import Image from "next/image"
import { bio, images } from "@/lib/content"

export default function BioSection() {
  return (
    <section id="about" className="bg-white px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        {/* Section label — brand blue */}
        <p className="mb-10 text-sm font-semibold uppercase tracking-widest text-ppf-blue">
          About
        </p>

        <div className="flex flex-col gap-10 md:flex-row md:gap-16">
          {/* Headshot with brand-colored border accent */}
          <div className="flex-shrink-0">
            <div className="relative h-64 w-64 overflow-hidden rounded-lg shadow-lg ring-4 ring-ppf-sky/20 md:h-80 md:w-80">
              <Image
                src={images.about}
                alt="Gregg Pavitt"
                fill
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* Bio text */}
          <div className="flex flex-col justify-center gap-6">
            {bio.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-lg leading-relaxed text-gray-700">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
