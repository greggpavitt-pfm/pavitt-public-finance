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
//                           - anonymous inserts into admin-RLS tables (e.g. /request-demo)
//                           Never expose this client to the browser.
//
// IMPORTANT: createServiceClient() uses the plain @supabase/supabase-js client
// rather than @supabase/ssr's createServerClient. The SSR variant is cookie-aware
// and constructs a per-request JWT context — even when handed the service-role
// key, the SSR client did NOT cleanly bypass RLS for anon (no-cookie) requests
// such as the public /request-demo submit. The plain client with the service-
// role key bypasses RLS unconditionally, which is what callers expect.

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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
// Use only in Server Actions / Route Handlers for operations like answer
// checking, admin approvals, or anonymous writes to admin-RLS tables.
//
// async preserved for call-site compatibility (every existing consumer awaits it).
export async function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Never expose this to the browser
    {
      auth: {
        // No session persistence — server-side, single-shot calls.
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
