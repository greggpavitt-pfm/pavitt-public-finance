// Next.js middleware — runs on every request before the page renders.
// Must be named middleware.ts and export a function named `middleware`.
//
// Responsibilities:
//   1. Refresh the Supabase session cookie so it doesn't expire mid-visit.
//   2. Protect routes that require authentication.
//   3. Redirect users to the right place based on their account state.
//
// Route rules:
//   /advisor/*   — must be logged in + account approved + onboarding complete
//   /training/*  — must be logged in + account approved + onboarding complete
//   /admin/*     — must be logged in + admin (checked again server-side per page)
//   /pending     — accessible when logged in but not yet approved
//   /onboarding  — accessible when logged in but onboarding not complete
//   All others   — public (marketing site, login, register)

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Create a Supabase client that can read/write cookies on the response.
  // This is the pattern recommended by Supabase for Next.js App Router middleware.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated cookies to both the request and the response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add any logic between createServerClient and getUser().
  // A simple mistake here will break session refresh for the entire app.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // --- Protect /training/* ---
  if (pathname.startsWith('/training')) {
    if (!user) {
      // Not logged in → send to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check profile state (approved + onboarding complete)
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status, onboarding_complete')
      .eq('id', user.id)
      .single()

    if (!profile) {
      // No profile row yet → send to onboarding
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    if (profile.account_status === 'pending') {
      return NextResponse.redirect(new URL('/pending', request.url))
    }

    if (profile.account_status === 'suspended') {
      // Do NOT call signOut() here — middleware runs on the Edge Runtime and
      // initiating a Supabase server-side signOut from the edge causes
      // MIDDLEWARE_INVOCATION_FAILED on Vercel.
      // Instead, redirect to /login with a flag; the login page clears the
      // session on the client via supabase.auth.signOut() after it loads.
      return NextResponse.redirect(new URL('/login?reason=suspended', request.url))
    }

    if (!profile.onboarding_complete) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // --- Protect /advisor/* ---
  // Same rules as /training: must be logged in + approved + onboarding complete
  if (pathname.startsWith('/advisor')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status, onboarding_complete')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    if (profile.account_status === 'pending') {
      return NextResponse.redirect(new URL('/pending', request.url))
    }

    if (profile.account_status === 'suspended') {
      return NextResponse.redirect(new URL('/login?reason=suspended', request.url))
    }

    if (!profile.onboarding_complete) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // --- Protect /admin/* ---
  // Full admin verification (role check) happens again inside each admin page;
  // this just blocks non-logged-in users at the edge.
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // --- Redirect logged-in users away from /login and /register ---
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/training', request.url))
  }

  return supabaseResponse
}

// Tell Next.js which paths this middleware should run on.
// Skip static assets, images, and Next.js internals.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
