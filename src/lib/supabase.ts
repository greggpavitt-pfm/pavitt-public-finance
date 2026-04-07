// src/lib/supabase.ts
// Supabase client factories for client-side and server-side usage.
// See .env.example for required environment variables.

import { createClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Browser client (uses anon key — safe for client bundle)
// ---------------------------------------------------------------------------

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy .env.example to .env.local and fill in your Supabase credentials."
    )
  }

  return createClient(url, anonKey)
}

// ---------------------------------------------------------------------------
// Server client (uses service role key — server-side only, bypasses RLS)
// ---------------------------------------------------------------------------

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Copy .env.example to .env.local and fill in your Supabase credentials."
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
