"use client"
// Sticky top navigation bar with PPF logo, anchor links, and IPSAS CTA
import Image from "next/image"
import { siteConfig, images } from "@/lib/content"

const navLinks = [
  { label: "About", href: "/#about" },
  { label: "Expertise", href: "/#expertise" },
  { label: "Regions", href: "/#regions" },
  { label: "Donors", href: "/#donors" },
  { label: "Contact", href: "/#contact" },
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between bg-ppf-navy/95 px-6 backdrop-blur md:px-16">
      {/* Brand logo + name — links back to top */}
      <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
        <Image
          src={images.logoTransparent}
          alt="PPF Logo"
          width={80}
          height={80}
          className="h-[72px] w-auto -my-4"
        />
        <span className="text-lg font-bold tracking-tight text-white">
          {siteConfig.companyName}
        </span>
      </a>

      {/* Links + CTA — hidden on very small screens, shown from sm breakpoint */}
      <div className="hidden items-center gap-6 sm:flex">
        <ul className="flex gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-blue-200 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* IPSAS Training — student practice questions */}
        <a
          href="/ipsas-training"
          className="ml-2 rounded-md bg-ppf-sky px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue"
        >
          IPSAS Training
        </a>

        {/* IPSAS Questions — practitioner advisor */}
        <a
          href="/ipsas-questions"
          className="rounded-md bg-ppf-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue border border-ppf-blue/30"
        >
          IPSAS Questions
        </a>
      </div>
    </nav>
  )
}
