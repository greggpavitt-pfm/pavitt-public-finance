// Hero section — full-width photo with PPF logo, name and tagline overlaid
import Image from "next/image"
import { siteConfig, images } from "@/lib/content"

export default function HeroSection() {
  return (
    <section className="relative h-[43vh] min-h-[250px] w-full overflow-hidden">
      {/* Background photo */}
      <Image
        src={images.hero}
        alt="Gregg Pavitt — fieldwork"
        fill
        priority
        className="object-cover object-center"
      />

      {/* Dark overlay with brand navy tint */}
      <div className="absolute inset-0 bg-ppf-navy/60" />

      {/* Text content — bottom-left aligned */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-12 md:px-16 md:py-16">
        {/* PPF logo mark */}
        <Image
          src={images.logoTransparent}
          alt="PPF Logo"
          width={72}
          height={72}
          className="mb-4 h-16 w-auto md:h-20 drop-shadow-lg"
        />
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
          {siteConfig.companyName}
        </h1>
        <p className="mt-3 text-xl font-normal tracking-widest text-ppf-blue md:text-2xl uppercase">
          {siteConfig.tagline}
        </p>
      </div>
    </section>
  )
}
