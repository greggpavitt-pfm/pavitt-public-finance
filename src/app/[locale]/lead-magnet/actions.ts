"use server"
// Server action for the IPSAS checklist lead magnet.
// On submit:
//   1. Validate email
//   2. Hash IP for dedup tracking
//   3. Upsert into newsletter_signups
//   4. Return download URL (HTML checklist; PDF generated when content is ready)

import { headers } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"
import { createHash } from "crypto"

export interface LeadMagnetState {
  status: "idle" | "success" | "error"
  message: string
  downloadUrl?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function captureLead(
  prevState: LeadMagnetState,
  formData: FormData
): Promise<LeadMagnetState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase()
  const source = (formData.get("source") as string | null)?.trim() || "ipsas-checklist"
  const consent = formData.get("consent") === "on"

  if (!email || !EMAIL_REGEX.test(email)) {
    return { status: "error", message: "Please enter a valid email address." }
  }
  if (!consent) {
    return { status: "error", message: "Please confirm you'd like to receive the download." }
  }

  // Hash the requester's IP for dedup tracking — never store raw IP
  let ipHash: string | undefined
  try {
    const h = await headers()
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      ""
    if (ip) {
      ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32)
    }
  } catch {
    // header lookup failed — continue without IP hash
  }

  let userAgent: string | undefined
  try {
    const h = await headers()
    userAgent = h.get("user-agent") ?? undefined
  } catch {
    // ignore
  }

  try {
    const serviceClient = await createServiceClient()
    const { error } = await serviceClient
      .from("newsletter_signups")
      .upsert(
        {
          email,
          source,
          ip_hash: ipHash,
          user_agent: userAgent,
          consented_at: new Date().toISOString(),
        },
        { onConflict: "email,source", ignoreDuplicates: false }
      )

    if (error) {
      console.error("Lead capture insert failed:", error)
      return {
        status: "error",
        message: "We couldn't save your details right now. Please try again later.",
      }
    }
  } catch (err) {
    console.error("Lead capture unexpected error:", err)
    return {
      status: "error",
      message: "Something went wrong. Please try again later.",
    }
  }

  return {
    status: "success",
    message: "Thanks. Your download is ready.",
    downloadUrl: "/downloads/ipsas-adoption-checklist.html",
  }
}
