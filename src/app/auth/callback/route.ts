// Route handler for Supabase email confirmation callbacks.
//
// When a user clicks the confirmation link in a Supabase email (sign-up,
// password reset, email change), Supabase redirects them here with a
// one-time `code` parameter. This handler exchanges that code for a
// session cookie, then sends the user to the right place.
//
// This route MUST exist — without it, the middleware intercepts the request
// before any session is established and the user gets a 500 error.
//
// Flow after sign-up confirmation:
//   1. User clicks link → lands here with ?code=XXXX
//   2. exchangeCodeForSession() establishes the session cookie
//   3. Redirect to /pending (account still needs admin approval)
//
// The middleware is configured to skip /auth/* so it doesn't interfere
// with code exchange before the session is set.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` lets Supabase (or us) specify a redirect destination in the link.
  // Default to /pending since a freshly confirmed account still needs admin approval.
  const next = searchParams.get('next') ?? '/pending'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Session established — send the user on their way.
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Code exchange failed (expired link, already used, etc.)
    console.error('Auth callback: code exchange failed', error.message)
  }

  // No code or exchange failed — redirect to login with an error message.
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
