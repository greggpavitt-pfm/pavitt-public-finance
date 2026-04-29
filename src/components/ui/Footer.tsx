// src/components/ui/Footer.tsx  (v2 fintech — drop-in replacement)
//
// 4-column dark footer: brand, sitemap, products, resources; fine-print rule.
// External links (LinkedIn) render as <a target="_blank"> not next/link.
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { siteConfig, images } from "@/lib/content"

export default function Footer() {
  const t = useTranslations("Footer")
  const year = new Date().getFullYear()

  // Columns are built inside the component so each link label can pull its
  // translation. Keeping the structure in one place (rather than a module-
  // level COLS constant) is the simplest way to wire next-intl into this
  // small component.
  const columns: Array<{
    title: string
    links: Array<{ label: string; href: string; external?: boolean }>
  }> = [
    {
      title: t("columns.site"),
      links: [
        { label: t("links.about"),     href: "/#about" },
        { label: t("links.expertise"), href: "/#expertise" },
        { label: t("links.regions"),   href: "/#regions" },
        { label: t("links.insights"),  href: "/insights" },
        { label: t("links.contact"),   href: "/#contact" },
      ],
    },
    {
      title: t("columns.products"),
      links: [
        { label: t("links.overview"), href: "/products" },
        { label: t("links.drills"),   href: "/drills" },
        { label: t("links.desk"),     href: "/desk" },
        { label: t("links.pricing"),  href: "/pricing" },
      ],
    },
    {
      title: t("columns.resources"),
      links: [
        { label: t("links.checklist"), href: "/lead-magnet" },
        { label: t("links.linkedin"), href: siteConfig.linkedIn, external: true },
      ],
    },
  ]

  const linkClass =
    "mb-2.5 block text-[13px] text-white/82 transition-colors hover:text-ppf-sky"

  return (
    <footer className="bg-ink-950 px-6 py-20 pb-7 text-white md:px-12">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Image
                src={images.logoTransparent}
                alt={t("logoAlt")}
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
              {t("tagline")}
            </p>
          </div>

          {columns.map((col) => (
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
          <span>&copy; {year} {siteConfig.companyName}. {t("rightsReserved")}</span>
          <span>{siteConfig.domain}</span>
        </div>
      </div>
    </footer>
  )
}
