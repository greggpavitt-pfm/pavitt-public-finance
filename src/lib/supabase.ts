// src/lib/supabase.ts
// Supabase client factories for client-side and server-side usage.
// See .env.example for required environment variables.

import { createClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"

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

// ---------------------------------------------------------------------------
// Authed client (uses anon key + user JWT — RLS enforced as the user)
// Use this in API routes so Row-Level Security applies automatically.
// ---------------------------------------------------------------------------

export function createAuthedClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
  }

  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
}

// ---------------------------------------------------------------------------
// Helper: extract Bearer token from an API request
// ---------------------------------------------------------------------------

export function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization")
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null
}
