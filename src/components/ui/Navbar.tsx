"use client"
// src/components/ui/Navbar.tsx  (v2 fintech — drop-in replacement)
//
// • On `/`: fixed positioning, transparent over hero, solidifies on scroll
// • On all other routes: sticky positioning, always solid (prevents the hero
//   transparent state from bleeding onto light-background pages like /login)
// • Mobile hamburger opens a full-width sheet below the bar

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { siteConfig, images } from "@/lib/content"
import LanguagePicker from "@/components/ui/LanguagePicker"

export default function Navbar() {
  const pathname = usePathname()
  const t = useTranslations("Navbar")

  // Path comparison must ignore the locale prefix — the homepage is `/` for
  // English but `/fr`, `/es`, `/pt` for other locales. Strip a leading
  // /xx segment if present.
  const localeStripped = pathname.replace(/^\/(en|fr|es|pt)(?=\/|$)/, "") || "/"
  const isHome = localeStripped === "/"

  // next-intl's <Link> isn't used here because the nav has section anchors
  // (#about, #expertise, …) that should always point at the homepage of the
  // active locale. We render plain <Link>/<a> with absolute paths; next-intl
  // middleware rewrites bare paths to the active locale automatically.
  const navLinks = [
    { label: t("links.about"),     href: "/#about" },
    { label: t("links.expertise"), href: "/#expertise" },
    { label: t("links.regions"),   href: "/#regions" },
    { label: t("links.products"),  href: "/products" },
    { label: t("links.pricing"),   href: "/pricing" },
    { label: t("links.insights"),  href: "/insights" },
    { label: t("links.contact"),   href: "/#contact" },
  ]

  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close mobile sheet on route-hash change
  useEffect(() => {
    const onHash = () => setOpen(false)
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  // Lock body scroll while mobile sheet is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  // On non-home pages always show the solid bar so white text isn't invisible
  // over light backgrounds (/login, /register, etc.)
  const solid = !isHome || scrolled || open

  return (
    <nav
      className={[
        // Fixed on home so the hero bleeds under it; sticky everywhere else
        // so content starts below the bar naturally
        isHome ? "fixed top-0 inset-x-0" : "sticky top-0",
        "z-50 transition-[background,border-color] duration-200",
        solid
          ? "bg-white/85 backdrop-blur-md backdrop-saturate-150 border-b border-ink-200"
          : "bg-transparent border-b border-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-[96px] max-w-[1240px] items-center justify-between px-6">
        {/* Brand. shrink-0 keeps the logo + company-name block at its natural
            width even when the desktop nav cluster on the right gets wider
            (e.g. with the language picker added). Without this the company
            name was wrapping to multiple lines on French/Spanish renders and
            colliding with the first nav link. */}
        <Link
          href="/"
          className={[
            "flex shrink-0 items-center gap-3 whitespace-nowrap text-sm font-semibold tracking-tight transition-colors",
            solid ? "text-ink-900" : "text-white",
          ].join(" ")}
        >
          <Image
            src={images.logoTransparent}
            alt={t("logoAlt")}
            width={80}
            height={80}
            priority
            unoptimized
            className="h-[84px] w-auto"
          />
          {/* Wordmark sits beside the logo only on wide screens (xl+).
              The logo itself already carries the "PPF" mark, so on standard
              laptop widths we hide the full company name to leave room for
              translated nav labels (longer in fr/es/pt) and the language
              picker. The screen reader still receives the brand via the
              logo's alt text. */}
          <span className="hidden xl:inline">{siteConfig.companyName}</span>
        </Link>

        {/* Desktop links. min-w-0 lets the cluster shrink before the brand
            does; whitespace-nowrap on each link keeps individual labels intact
            (particularly important for translated labels like "À propos"). */}
        <div className="hidden min-w-0 items-center gap-7 md:flex">
          <ul className="flex shrink-0 gap-7 whitespace-nowrap">
            {navLinks.map((link) => {
              const isRoute = link.href.startsWith("/") && !link.href.includes("#")
              const className = [
                "text-sm font-medium transition-colors",
                solid
                  ? "text-ink-700 hover:text-ink-900"
                  : "text-white/85 hover:text-white",
              ].join(" ")
              return (
                <li key={link.href}>
                  {isRoute ? (
                    <Link href={link.href} className={className}>
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className={className}>
                      {link.label}
                    </a>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Language picker — sits between the link list and the product CTAs.
              `onDark` flips the styling when the navbar is over the dark hero. */}
          <LanguagePicker onDark={!solid} />

          <Link
            href="/drills"
            className="rounded-md bg-ppf-sky px-3.5 py-1.5 text-sm font-medium text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
          >
            {t("ctas.drills")}
          </Link>
          <Link
            href="/desk"
            className="rounded-md bg-[#2A8FE0] px-3.5 py-1.5 text-sm font-medium text-white shadow-crisp-sm transition-colors hover:bg-[#3B9AE1]"
          >
            {t("ctas.desk")}
          </Link>
          {/* Pricing already lives in the main nav links above; Request demo is
              kept as a secondary outlined CTA so existing inbound links work. */}
          <Link
            href="/request-demo"
            className="rounded-md border border-ppf-sky px-3.5 py-1.5 text-sm font-medium text-ppf-sky transition-colors hover:bg-ppf-sky hover:text-white"
          >
            {t("ctas.requestDemo")}
          </Link>
        </div>

        {/* Mobile: hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t("closeMenu") : t("openMenu")}
          aria-expanded={open}
          className={[
            "md:hidden flex h-10 w-10 items-center justify-center rounded-md transition-colors",
            solid ? "text-ink-900 hover:bg-ink-100" : "text-white hover:bg-white/10",
          ].join(" ")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            ) : (
              <>
                <path d="M4 7h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                <path d="M4 12h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                <path d="M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        className={[
          "md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0",
          "bg-white border-b border-ink-200",
        ].join(" ")}
      >
        <ul className="px-6 pb-5 pt-2">
          {navLinks.map((link) => {
            const isRoute = link.href.startsWith("/") && !link.href.includes("#")
            const className = "block border-b border-ink-100 py-3 text-base font-medium text-ink-900"
            return (
              <li key={link.href}>
                {isRoute ? (
                  <Link href={link.href} onClick={() => setOpen(false)} className={className}>
                    {link.label}
                  </Link>
                ) : (
                  <a href={link.href} onClick={() => setOpen(false)} className={className}>
                    {link.label}
                  </a>
                )}
              </li>
            )
          })}
          <li className="mt-4 flex flex-col gap-2">
            {/* Language picker on its own row above the product CTAs. */}
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-500">
                {/* The label translates because LanguagePicker reads it from
                    the LanguagePicker namespace. We render it here for the
                    mobile sheet only — desktop relies on the select's own
                    aria-label for screen readers. */}
              </span>
              <LanguagePicker variant="compact" onDark={false} />
            </div>
            <Link
              href="/drills"
              onClick={() => setOpen(false)}
              className="rounded-md bg-ppf-sky px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              {t("ctas.drills")}
            </Link>
            <Link
              href="/desk"
              onClick={() => setOpen(false)}
              className="rounded-md bg-[#2A8FE0] px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              {t("ctas.desk")}
            </Link>
            <Link
              href="/request-demo"
              onClick={() => setOpen(false)}
              className="rounded-md border border-ppf-sky px-4 py-2.5 text-center text-sm font-medium text-ppf-sky"
            >
              {t("ctas.requestDemo")}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}
