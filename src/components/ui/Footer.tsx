// Footer with PPF logo, copyright and LinkedIn link
import Image from "next/image"
import { siteConfig, images } from "@/lib/content"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-ppf-navy px-6 py-10 md:px-16">
      <div className="mx-auto max-w-6xl flex flex-col items-center gap-4">
        {/* PPF logo */}
        <Image
          src={images.logoTransparent}
          alt="PPF Logo"
          width={144}
          height={144}
          className="h-36 w-auto opacity-80"
        />

        <p className="text-center text-sm text-blue-200/70">
          &copy; {year} {siteConfig.companyName} &mdash; All rights reserved.
        </p>
      </div>
    </footer>
  )
}
