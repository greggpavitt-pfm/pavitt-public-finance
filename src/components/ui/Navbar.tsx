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
import { siteConfig, images } from "@/lib/content"

const navLinks = [
  { label: "About", href: "/#about" },
  { label: "Expertise", href: "/#expertise" },
  { label: "Regions", href: "/#regions" },
  { label: "Donors", href: "/#donors" },
  { label: "Contact", href: "/#contact" },
]

export default function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === "/"

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
      <div className="mx-auto flex h-[60px] max-w-[1240px] items-center justify-between px-6 md:px-12">
        {/* Brand */}
        <Link
          href="/"
          className={[
            "flex items-center gap-3 text-sm font-semibold tracking-tight transition-colors",
            solid ? "text-ink-900" : "text-white",
          ].join(" ")}
        >
          <Image
            src={images.logoTransparent}
            alt="PPF Logo"
            width={80}
            height={80}
            priority
            className="h-7 w-auto"
          />
          <span>{siteConfig.companyName}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          <ul className="flex gap-7">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={[
                    "text-sm font-medium transition-colors",
                    solid
                      ? "text-ink-700 hover:text-ink-900"
                      : "text-white/85 hover:text-white",
                  ].join(" ")}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <Link
            href="/ipsas-training"
            className="rounded-md bg-ppf-sky px-3.5 py-1.5 text-sm font-medium text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
          >
            IPSAS Training
          </Link>
          <Link
            href="/ipsas-questions"
            className={[
              "rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors",
              solid
                ? "border-ink-200 text-ink-900 hover:border-ink-300 hover:bg-ink-50"
                : "border-white/20 text-white hover:bg-white/10",
            ].join(" ")}
          >
            IPSAS Questions
          </Link>
        </div>

        {/* Mobile: hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
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
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block border-b border-ink-100 py-3 text-base font-medium text-ink-900"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="mt-4 flex flex-col gap-2">
            <Link
              href="/ipsas-training"
              onClick={() => setOpen(false)}
              className="rounded-md bg-ppf-sky px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              IPSAS Training
            </Link>
            <Link
              href="/ipsas-questions"
              onClick={() => setOpen(false)}
              className="rounded-md border border-ink-200 px-4 py-2.5 text-center text-sm font-medium text-ink-900"
            >
              IPSAS Questions
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}
