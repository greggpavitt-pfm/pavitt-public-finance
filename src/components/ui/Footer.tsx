// src/components/ui/Footer.tsx  (v2 fintech — drop-in replacement)
//
// 4-column dark footer: brand, sitemap, toolkit, legal; fine-print rule.
// External links (LinkedIn) render as <a target="_blank"> not next/link.
import Image from "next/image"
import Link from "next/link"
import { siteConfig, images } from "@/lib/content"

type FooterLink = { label: string; href: string; external?: boolean }
type FooterCol = { title: string; links: FooterLink[] }

const COLS: FooterCol[] = [
  {
    title: "Site",
    links: [
      { label: "About",     href: "/#about" },
      { label: "Expertise", href: "/#expertise" },
      { label: "Regions",   href: "/#regions" },
      { label: "Insights",  href: "/insights" },
      { label: "Contact",   href: "/#contact" },
    ],
  },
  {
    title: "Products",
    links: [
      { label: "Overview",        href: "/products" },
      { label: "IPSAS Training",  href: "/ipsas-training" },
      { label: "IPSAS Questions", href: "/ipsas-questions" },
      { label: "Practitioner Advisor", href: "/products#advisor" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "IPSAS Adoption Checklist", href: "/lead-magnet" },
      { label: "LinkedIn", href: siteConfig.linkedIn, external: true },
    ],
  },
]

const linkClass = "mb-2.5 block text-[13px] text-white/82 transition-colors hover:text-ppf-sky"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-ink-950 px-6 py-20 pb-7 text-white md:px-12">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Image
                src={images.logoTransparent}
                alt="PPF"
                width={80}
                height={80}
                unoptimized
                className="h-8 w-auto opacity-95"
              />
              <div>
                <div className="text-[15px] font-semibold tracking-[-0.01em]">
                  {siteConfig.companyName}
                </div>
                <div className="mt-0.5 font-mono text-[12px] text-white/50">
                  {siteConfig.domain}
                </div>
              </div>
            </div>
            <p className="mt-1 max-w-[34ch] text-[13px] leading-[1.55] text-white/60">
              Public financial management advisory for Ministries of Finance and
              the donors who fund them.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h5 className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                {col.title}
              </h5>
              {col.links.map((l) =>
                l.external ? (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.href} href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                )
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 h-px bg-white/10" />
        <div className="mt-4 flex flex-wrap justify-between gap-2 font-mono text-xs tabular-nums text-white/40">
          <span>&copy; {year} {siteConfig.companyName}. All rights reserved.</span>
          <span>{siteConfig.domain}</span>
        </div>
      </div>
    </footer>
  )
}
