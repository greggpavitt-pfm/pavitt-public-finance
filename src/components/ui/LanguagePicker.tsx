"use client"
// Language picker — select control that switches the active locale.
//
// On change: builds a target URL by stripping the leading locale segment
// from the current path and prepending the new one (no prefix for the
// default English locale, since routing.localePrefix === 'as-needed').
// The component is locale-aware via useTranslations + useLocale, so the
// option labels translate ("English", "Français", …).

import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { LOCALE_PREFIX_RE, localizePath, routing, type Locale } from "@/i18n/routing"

interface Props {
  /** Use a compact set of styles (e.g. inside the mobile navigation sheet). */
  variant?: "default" | "compact"
  /** Tailwind classes applied to the rendered <select> on top of the variant. */
  className?: string
  /** When the navbar is over the dark hero, the select needs to read white-on-dark. */
  onDark?: boolean
}

const LOCALE_LABEL_KEYS: Record<Locale, "english" | "french" | "spanish" | "portuguese"> = {
  en: "english",
  fr: "french",
  es: "spanish",
  pt: "portuguese",
}

export default function LanguagePicker({ variant = "default", className = "", onDark = false }: Props) {
  const t = useTranslations("LanguagePicker")
  const locale = useLocale() as Locale
  const pathname = usePathname() ?? "/"
  const searchParams = useSearchParams()
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Locale
    if (next === locale) return

    // Build the new path. usePathname() returns only the pathname; query
    // string and hash must be re-attached separately or banner state
    // (?reason=suspended on /login) and scroll anchors (#contact, #bundle)
    // are lost. Hash is only readable client-side.
    const stripped = pathname.replace(LOCALE_PREFIX_RE, "") || "/"
    const localizedPath = localizePath(stripped, next)
    const search = searchParams?.toString() ?? ""
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    const target = `${localizedPath}${search ? `?${search}` : ""}${hash}`
    router.push(target)
  }

  // Visual styles. The select uses appearance-none + a chevron svg-as-bg so
  // it looks consistent across browsers without bringing in an icon pack.
  const baseClass =
    "appearance-none rounded-md border bg-no-repeat bg-right pr-7 pl-2.5 text-[12px] font-medium leading-tight focus:outline-none cursor-pointer transition-colors"
  const dayClass = onDark
    ? "border-white/30 bg-white/10 text-white hover:bg-white/15"
    : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
  const sizeClass = variant === "compact" ? "h-8 py-1" : "h-9 py-1.5"

  // SVG chevron rendered as background; uses the correct stroke colour for
  // dark/light contexts. Defined here (not Tailwind class) because Tailwind v4
  // doesn't have built-in chevron utilities.
  const chevron = onDark
    ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%23ffffff' stroke-width='1.75'><path d='M6 8l4 4 4-4' stroke-linecap='round'/></svg>"
    : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%23475569' stroke-width='1.75'><path d='M6 8l4 4 4-4' stroke-linecap='round'/></svg>"

  return (
    <select
      aria-label={t("label")}
      value={locale}
      onChange={handleChange}
      className={`${baseClass} ${dayClass} ${sizeClass} ${className}`}
      style={{ backgroundImage: `url("${chevron}")`, backgroundSize: "12px 12px", backgroundPositionX: "calc(100% - 8px)" }}
    >
      {routing.locales.map((code) => (
        // <option> renders in the browser's native dropdown — most browsers
        // give it default white-on-light styling. Don't try to colour-style
        // the options for the dark navbar; the parent select does that.
        <option key={code} value={code} className="bg-white text-ink-900">
          {t(LOCALE_LABEL_KEYS[code])}
        </option>
      ))}
    </select>
  )
}
