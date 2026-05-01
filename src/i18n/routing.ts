// next-intl routing configuration.
//
// Locales:
//   en (default — root paths stay bare: /desk, /pricing, /advisor)
//   fr / es / pt — locale-prefixed: /fr/desk, /es/pricing, /pt/advisor
//
// localePrefix 'as-needed' means English URLs do NOT get an /en prefix.
// Existing English bookmarks and inbound links continue to work unchanged.
// Switching to /fr, /es, or /pt adds the prefix.
//
// Adding a new locale: append to the `locales` array, add a matching
// messages/<code>.json file, and re-run `npm run translate:all`.

import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'fr', 'es', 'pt'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
})

// Convenience type aliases used throughout the app.
export type Locale = (typeof routing.locales)[number]

// Regex matching a leading locale segment (e.g. /fr, /es) for any configured
// locale. Used to strip the locale prefix from URLs before composing a target
// path in another locale. Derived from `routing.locales` so adding a new
// locale picks up automatically.
export const LOCALE_PREFIX_RE = new RegExp(
  `^/(?:${routing.locales.join('|')})(?=/|$)`,
)

// Build a locale-aware path. Returns the bare path for the default locale
// (en) and a `/<locale>` prefix for non-default locales. Mirrors the
// `localePrefix: 'as-needed'` URL convention.
export function localizePath(path: string, locale: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  if (locale === routing.defaultLocale) return cleanPath
  return `/${locale}${cleanPath === '/' ? '' : cleanPath}`
}

// BCP-47 locale tags for use with `Intl.DateTimeFormat` and
// `Date.prototype.toLocaleDateString`. Falls back to en-GB for unknown
// locales (English audience is mostly UK/international, not US, so we keep
// the 'd Month yyyy' form rather than US 'Month d, yyyy').
const DATE_LOCALE: Record<string, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-PT',
}
export function getDateLocale(locale: string): string {
  return DATE_LOCALE[locale] ?? 'en-GB'
}

// Open Graph locale tags (`og:locale` metadata). Used by Facebook, LinkedIn,
// etc. to localize their share-card UI.
const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  fr: 'fr_FR',
  es: 'es_ES',
  pt: 'pt_PT',
}
export function getOgLocale(locale: string): string {
  return OG_LOCALE[locale] ?? 'en_US'
}

// All non-current OG locales for `og:alternateLocale`. Tells share-card
// consumers which other locales the same page is available in.
export function getAlternateOgLocales(locale: string): string[] {
  return routing.locales
    .filter((l) => l !== locale)
    .map((l) => OG_LOCALE[l] ?? 'en_US')
}
