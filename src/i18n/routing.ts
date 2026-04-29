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
