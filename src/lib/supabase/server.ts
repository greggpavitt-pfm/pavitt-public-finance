// Server-side Supabase client.
// Use this in Server Components, Server Actions, and Route Handlers.
// It reads/writes the session cookie so the user stays logged in across requests.
//
// There are two clients here:
//   createClient()        — uses the anon key, respects RLS (for normal data reads)
//   createServiceClient() — uses the service_role key, bypasses RLS entirely.
//                           Only use this for privileged operations like:
//                           - approving/rejecting users (admin actions)
//                           - scoring assessments (reading correct_answer)
//                           Never expose this client to the browser.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Standard server client — respects RLS, safe to use for all normal reads
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from a Server Component where cookies are read-only.
            // The proxy (src/proxy.ts) handles refreshing the session,
            // so this error is safe to ignore here.
          }
        },
      },
    }
  )
}

// Privileged server client — bypasses RLS.
// Use only in Server Actions for operations like answer checking or admin approvals.
export async function createServiceClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Never expose this to the browser
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Same as above — safe to ignore in Server Components
          }
        },
      },
    }
  )
}
