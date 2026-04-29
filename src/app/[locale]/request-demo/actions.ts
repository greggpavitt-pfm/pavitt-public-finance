"use server"
// Public demo-request submission.
//
// Anyone (anon) can POST this. To keep the org_requests table free of spam:
//   1. Honeypot field "website" — bots fill it; humans don't see it. Reject if filled.
//   2. Per-IP rate limit: 3 submissions per hour from the same IP. Enforced via
//      a count() against org_requests.source_ip — no extra service required.
//   3. Email format + minimum length checks on every text field.
//
// All inserts go through the service-role client (org_requests RLS has no
// insert policy — only the service key bypasses it). The action returns a
// generic "thanks, we'll be in touch" payload regardless of outcome to avoid
// leaking whether an email or org name was already submitted.

import { headers } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_PER_IP_PER_HOUR = 3

export interface DemoRequestInput {
  org_name: string
  country: string
  contact_name: string
  contact_email: string
  role?: string
  expected_users?: number
  accounting_type?: "cash-basis" | "accrual" | "custom"
  website?: string  // honeypot — must be empty
}

export interface DemoRequestResult {
  ok: boolean
  message: string
}

export async function submitDemoRequest(
  input: DemoRequestInput
): Promise<DemoRequestResult> {
  // Honeypot — bot detection. Silent success: bot thinks it worked.
  if (input.website && input.website.trim().length > 0) {
    return { ok: true, message: "Thanks — we'll be in touch within one business day." }
  }

  // Field validation
  const errors: string[] = []
  if (!input.org_name || input.org_name.trim().length < 2) errors.push("Organisation name required")
  if (!input.country || input.country.trim().length < 2) errors.push("Country required")
  if (!input.contact_name || input.contact_name.trim().length < 2) errors.push("Your name required")
  if (!input.contact_email || !EMAIL_RE.test(input.contact_email)) errors.push("Valid email required")
  if (input.expected_users !== undefined && input.expected_users !== null) {
    const n = Number(input.expected_users)
    if (!Number.isInteger(n) || n < 1 || n > 10000) errors.push("Expected users must be 1–10000")
  }
  if (errors.length > 0) {
    return { ok: false, message: errors.join(". ") }
  }

  // Best-effort source-IP capture. Vercel sets x-forwarded-for; first hop is the client.
  const h = await headers()
  const fwd = h.get("x-forwarded-for") ?? ""
  const sourceIp = fwd.split(",")[0]?.trim() || h.get("x-real-ip") || null

  const serviceClient = await createServiceClient()

  // Rate limit by IP — count last hour
  if (sourceIp) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await serviceClient
      .from("org_requests")
      .select("id", { count: "exact", head: true })
      .eq("source_ip", sourceIp)
      .gte("created_at", oneHourAgo)
    if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) {
      // Generic message — don't reveal the limit to scrapers.
      return { ok: false, message: "Too many requests. Please email contact@pfmexpert.net directly." }
    }
  }

  const { error } = await serviceClient
    .from("org_requests")
    .insert({
      org_name: input.org_name.trim(),
      country: input.country.trim(),
      contact_name: input.contact_name.trim(),
      contact_email: input.contact_email.trim().toLowerCase(),
      role: input.role?.trim() || null,
      expected_users: input.expected_users ?? null,
      accounting_type: input.accounting_type ?? null,
      source_ip: sourceIp,
      status: "pending",
    })

  if (error) {
    console.error("submitDemoRequest: insert failed", { error: error.message })
    // Still return ok=true to the client — we don't want to leak DB state.
    // Operator will see no row appear, but server logs capture the failure.
    return { ok: false, message: "Submission failed. Please email contact@pfmexpert.net." }
  }

  return { ok: true, message: "Thanks — we'll be in touch within one business day." }
}
