// Next.js 16+ proxy file — runs on every request before the page renders.
// In Next.js 16 the convention changed: this file must be named proxy.ts and
// export a function named `proxy` (the old middleware.ts / middleware() names
// are deprecated and will not run on Vercel).
//
// Responsibilities:
//   1. Run next-intl locale negotiation (redirects /xx unknown to default,
//      rewrites bare paths like /desk to the default locale internally, etc.)
//   2. Refresh the Supabase session cookie so it doesn't expire mid-visit.
//   3. Protect routes that require authentication, with locale-aware redirects.
//
// Route rules (path matched after stripping the locale prefix):
//   /advisor/*          — must be logged in + account approved
//   /training/*         — must be logged in + account approved + onboarding complete
//   /admin/*            — must be logged in (per-page admin role check on top)
//   /pending            — accessible when logged in but not yet approved
//   /onboarding         — accessible when logged in but onboarding not complete
//   /practitioner-login — redirect to /advisor if already logged in
//   All others          — public (marketing, login, register)
//
// Locale-aware redirects: if a French visitor (/fr/...) hits a protected path
// without a session, they are redirected to /fr/login (not /login).

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

// next-intl middleware instance — built once at module load, not per-request.
const handleI18n = createIntlMiddleware(routing)

// Match a leading locale segment, e.g. /fr or /es-MX or /pt followed by /
// or end-of-string. Constructed from the locales declared in routing.ts so
// the regex stays in sync if a locale is added.
const LOCALE_RE = new RegExp(`^/(?:${routing.locales.join('|')})(?=/|$)`)

/** Returns { locale, path } where path has the locale prefix removed. */
function splitLocale(pathname: string): { locale: string; path: string } {
  const match = pathname.match(LOCALE_RE)
  if (match) {
    const locale = match[0].slice(1) // drop leading /
    const path = pathname.slice(match[0].length) || '/'
    return { locale, path }
  }
  return { locale: routing.defaultLocale, path: pathname }
}

/** Build a locale-prefixed URL for redirects. English (default) stays bare. */
function localizedUrl(path: string, locale: string, base: string | URL): URL {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  return new URL(`${prefix}${path}`, base)
}

/**
 * Build a redirect response that carries any cookies the @supabase/ssr setAll
 * callback wrote onto `cookieSource`. Without this, refreshed Supabase
 * session cookies (rotated by getUser() near token expiry) are dropped on
 * every auth-driven redirect, causing the browser to keep the stale token
 * until it fully expires — a recipe for unexpected logouts in edge cases
 * (parallel tabs racing refresh, redirect chains, REUSE_INTERVAL elapsed).
 */
function redirectWithCookies(
  url: URL,
  cookieSource: NextResponse,
): NextResponse {
  const response = NextResponse.redirect(url)
  cookieSource.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie)
  })
  return response
}

export async function proxy(request: NextRequest) {
  // 1. Let next-intl decide locale routing first. The returned response will
  //    either be a redirect (e.g. unknown locale → default), a rewrite (bare
  //    `/desk` → internal `/en/desk`), or a plain pass-through. We mutate
  //    cookies on this response below so they survive the redirect/rewrite.
  const i18nResponse = handleI18n(request)

  // 2. Build a Supabase client that writes any session-refresh cookies onto
  //    the i18n response. This is the @supabase/ssr pattern adapted for
  //    composition with another middleware: setAll writes cookies on whatever
  //    response we plan to return.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mirror cookies back onto the request (so further reads in this
          // proxy invocation see them) and onto the response (so the browser
          // gets them).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            i18nResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add any logic between createServerClient and getUser().
  // A simple mistake here will break session refresh for the entire app.
  const { data: { user } } = await supabase.auth.getUser()

  // 3. Strip locale prefix once for path-pattern matching. Auth redirects
  //    use `localizedUrl()` to keep the user on their chosen language.
  const { locale, path } = splitLocale(request.nextUrl.pathname)

  // --- Protect /training/* ---
  if (path.startsWith('/training')) {
    if (!user) {
      return redirectWithCookies(localizedUrl('/login', locale, request.url), i18nResponse)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status, onboarding_complete')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return redirectWithCookies(localizedUrl('/onboarding', locale, request.url), i18nResponse)
    }

    if (profile.account_status === 'pending') {
      return redirectWithCookies(localizedUrl('/pending', locale, request.url), i18nResponse)
    }

    if (profile.account_status === 'suspended') {
      // Do NOT call signOut() here — proxy runs on the Edge Runtime and
      // initiating a Supabase server-side signOut from the edge causes
      // MIDDLEWARE_INVOCATION_FAILED on Vercel. The login page clears the
      // session client-side after it loads.
      return redirectWithCookies(localizedUrl('/login?reason=suspended', locale, request.url), i18nResponse)
    }

    if (!profile.onboarding_complete) {
      return redirectWithCookies(localizedUrl('/onboarding', locale, request.url), i18nResponse)
    }
  }

  // --- Protect /advisor/* ---
  // Requires login + approved account. Does NOT require onboarding_complete —
  // practitioners set their context inside the advisor via ContextPanel.
  if (path.startsWith('/advisor')) {
    if (!user) {
      return redirectWithCookies(localizedUrl('/practitioner-login', locale, request.url), i18nResponse)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status')
      .eq('id', user.id)
      .single()

    if (!profile || profile.account_status === 'pending') {
      return redirectWithCookies(localizedUrl('/pending', locale, request.url), i18nResponse)
    }

    if (profile.account_status === 'suspended') {
      return redirectWithCookies(localizedUrl('/practitioner-login?reason=suspended', locale, request.url), i18nResponse)
    }
  }

  // --- Protect /admin/* ---
  // Full admin role verification happens again inside each admin page;
  // this just blocks non-logged-in users at the edge.
  if (path.startsWith('/admin')) {
    if (!user) {
      return redirectWithCookies(localizedUrl('/login', locale, request.url), i18nResponse)
    }
  }

  // --- Redirect logged-in users away from /login and /register ---
  if (user && (path === '/login' || path === '/register')) {
    return redirectWithCookies(localizedUrl('/training', locale, request.url), i18nResponse)
  }
  if (user && path === '/practitioner-login') {
    return redirectWithCookies(localizedUrl('/advisor', locale, request.url), i18nResponse)
  }

  // No auth redirect — return next-intl's response (with refreshed Supabase
  // cookies attached via setAll above).
  return i18nResponse
}

// Tell Next.js which paths this proxy should run on.
// Skip static assets, images, Next.js internals, /api/* (no locale or auth
// gate at edge — handled per-route), and /auth/* (the callback exchanges
// the OAuth code for a session before any cookies are set).
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|images/|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
