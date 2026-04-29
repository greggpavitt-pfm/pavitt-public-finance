// Server-side message loader for next-intl.
//
// Called once per request by next-intl. Picks the active locale from the
// URL (provided by the next-intl middleware in proxy.ts), validates it,
// and dynamically imports the matching messages JSON.
//
// Returning the locale here is required when using `localePrefix: 'as-needed'`
// so that the bare-root English URLs (e.g. `/desk`) get a locale of 'en'
// rather than the requested-undefined value next-intl receives.

import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is a Promise<string | undefined> in next-intl v4.
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    // Dynamic import keeps each locale's bundle separate — only the
    // messages for the active language are loaded into the request.
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
