"use server"
// Server actions for authentication — register, login, logout, onboarding.
// These run on the server only and use the Supabase clients from src/lib/supabase/.
//
// Key security notes:
//   - Organisation lookup at registration uses createServiceClient() so it bypasses RLS
//     (the organisations table has no public SELECT policy by design).
//   - Beta testers register with org_id = null; the form sends the string "beta" which
//     is resolved to null before the profile insert.
//   - All other writes use the anon client with the user's session.

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { LOCALE_PREFIX_RE, localizePath, routing } from "@/i18n/routing"

// Resolve locale from a hidden form field; fall back to default. Forms in the
// [locale] route group submit useLocale() into a hidden 'locale' input.
function resolveLocale(formData: FormData): string {
  const raw = (formData.get("locale") as string | null) ?? ""
  return (routing.locales as readonly string[]).includes(raw) ? raw : routing.defaultLocale
}

// Resolve locale from the Referer header — used by logoutUser, which has no
// FormData. The referer is the page the user clicked logout from, so its
// locale prefix is the active locale. Falls back to the default locale.
async function resolveLocaleFromReferer(): Promise<string> {
  const h = await headers()
  const referer = h.get("referer") ?? ""
  try {
    const path = new URL(referer).pathname
    const match = path.match(LOCALE_PREFIX_RE)
    if (match) {
      const segment = match[0].slice(1) // strip leading '/'
      if ((routing.locales as readonly string[]).includes(segment)) return segment
    }
  } catch {
    // Bad URL — fall through.
  }
  return routing.defaultLocale
}

export interface AuthFormState {
  status: "idle" | "success" | "error"
  message: string
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
// Creates a Supabase auth user, then inserts a profiles row with account_status
// = 'pending'. The user cannot access /training until an admin approves them.
// org_id is null for beta testers (independent registration).

export async function registerUser(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email         = (formData.get("email")          as string | null)?.trim() ?? ""
  const password      = (formData.get("password")       as string | null) ?? ""
  const fullName      = (formData.get("full_name")      as string | null)?.trim() ?? ""
  const jobTitle      = (formData.get("job_title")      as string | null)?.trim() ?? ""
  const orgIdRaw      = (formData.get("org_id")         as string | null)?.trim() ?? ""
  const pathway       = (formData.get("pathway")        as string | null) ?? ""
  const ability       = (formData.get("ability_level")  as string | null) ?? ""
  const productAccess = (formData.get("product_access") as string | null) ?? "training"

  // --- Basic validation ---
  if (!email || !password || !fullName || !orgIdRaw) {
    return { status: "error", message: "Please fill in all required fields." }
  }
  // Beta testers must choose a pathway manually; org users get it derived from their org
  if (orgIdRaw === "beta" && !pathway) {
    return { status: "error", message: "Please select a basis of accounting." }
  }
  if (pathway === "accrual" && !ability) {
    return { status: "error", message: "Please select a difficulty level for the accrual pathway." }
  }
  if (password.length < 8) {
    return { status: "error", message: "Password must be at least 8 characters." }
  }

  // --- Resolve the organisation ---
  // "beta" is the sentinel value from the form meaning "independent / no org".
  // Any other value should be a valid organisation UUID.
  const isBeta = orgIdRaw === "beta"
  let resolvedOrgId: string | null = null
  let resolvedPathway = pathway
  let isDemo = false

  if (!isBeta) {
    // Verify the selected org exists and is accepting registrations (service client bypasses RLS)
    const serviceClient = await createServiceClient()
    const { data: org, error: orgError } = await serviceClient
      .from("organisations")
      .select("id, accounting_type, jurisdiction_code, demo")
      .eq("id", orgIdRaw)
      // Accept registration for any active plan; reject expired/suspended.
      .not("plan_type", "in", "(expired,suspended)")
      .single()

    if (orgError || !org) {
      return { status: "error", message: "Organisation not found. Please contact the administrator." }
    }
    resolvedOrgId = org.id
    isDemo = org.demo ?? false

    // Derive pathway from org's accounting type — overrides whatever the form sent
    if (org.accounting_type === "cash-basis") {
      resolvedPathway = "cash-basis"
    } else if (org.accounting_type === "accrual") {
      resolvedPathway = "accrual"
    } else if (org.accounting_type === "custom") {
      // Custom type: look up the base pathway for this jurisdiction
      // SIG (Solomon Islands) = cash-basis
      const CUSTOM_PATHWAY: Record<string, string> = { SIG: "cash-basis" }
      resolvedPathway = CUSTOM_PATHWAY[org.jurisdiction_code ?? ""] ?? "cash-basis"
    }
  }
  // Beta testers: resolvedOrgId remains null, pathway comes from form

  // --- Create the auth user ---
  // emailRedirectTo locks the confirmation link target to our /auth/callback route.
  // Without this, Supabase falls back to the dashboard "Site URL" — if that drifts
  // (or /auth/callback isn't on the Redirect URLs allowlist) users land on a
  // Supabase "Internal Server Error" page after clicking the email confirm link.
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pfmexpert.net"
  const supabase = await createClient()
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback`,
    },
  })

  if (signUpError) {
    // Surface common errors in plain language
    if (signUpError.message.toLowerCase().includes("already registered")) {
      return { status: "error", message: "An account with that email already exists. Please log in instead." }
    }
    return { status: "error", message: signUpError.message }
  }

  const userId = signUpData.user?.id
  if (!userId) {
    return { status: "error", message: "Account creation failed — please try again." }
  }

  // --- Insert the profile row ---
  // account_status defaults to 'pending' in the schema; we set it explicitly for clarity.
  const serviceClient = await createServiceClient()
  // Validate product_access to the three allowed values
  const allowedProducts = ["training", "advisor", "both"]
  const resolvedProductAccess = allowedProducts.includes(productAccess) ? productAccess : "training"

  // Demo orgs skip the admin approval step — account goes straight to approved
  const accountStatus = isDemo ? "approved" : "pending"

  const { error: profileError } = await serviceClient
    .from("profiles")
    .insert({
      id:                  userId,
      full_name:           fullName,
      job_title:           jobTitle || null,
      org_id:              resolvedOrgId,   // null for beta testers
      pathway:             resolvedPathway, // derived from org accounting type
      ability_level:       resolvedPathway === "accrual" ? ability : null,
      account_status:      accountStatus,
      onboarding_complete: false,
      product_access:      resolvedProductAccess,
    })

  if (profileError) {
    // Profile insert failed — attempt to delete the orphaned auth user so they can try again.
    // Without this, the user would be stuck: auth exists but no profile, so they can never log in.
    console.error("Profile insert failed for user", userId, profileError)
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error("Failed to clean up orphaned auth user", userId, deleteError)
    }
    return { status: "error", message: "Account setup failed. Please try again." }
  }

  // Demo org users are already approved — send straight to training.
  // All others wait for admin approval.
  const locale = resolveLocale(formData)
  redirect(localizePath(isDemo ? "/training" : "/pending", locale))
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
// Signs the user in. The form can pass an optional hidden `redirect_to` field
// to control where the user lands after login (e.g. /advisor for practitioners).
// Only /training and /advisor are accepted — anything else defaults to /training.

export async function loginUser(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email      = (formData.get("email")       as string | null)?.trim() ?? ""
  const password   = (formData.get("password")    as string | null) ?? ""
  const redirectTo = (formData.get("redirect_to") as string | null) ?? ""

  if (!email || !password) {
    return { status: "error", message: "Please enter your email and password." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { status: "error", message: "Incorrect email or password. Please try again." }
  }

  // Safelist: only allow redirecting to known internal destinations
  const allowed = ["/training", "/advisor"]
  const destination = allowed.includes(redirectTo) ? redirectTo : "/training"

  // Middleware will redirect them to the right page based on profile state
  // (pending → /pending, onboarding incomplete → /onboarding).
  const locale = resolveLocale(formData)
  redirect(localizePath(destination, locale))
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logoutUser(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const locale = await resolveLocaleFromReferer()
  redirect(localizePath("/login", locale))
}

// ---------------------------------------------------------------------------
// Complete onboarding
// ---------------------------------------------------------------------------
// Called from /onboarding once the user confirms their pathway + difficulty.
// Sets onboarding_complete = true so middleware lets them through to /training.

export async function completeOnboarding(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const pathway = (formData.get("pathway")       as string | null) ?? ""
  const ability = (formData.get("ability_level") as string | null) ?? ""

  if (!pathway) {
    return { status: "error", message: "Please select a pathway." }
  }
  if (pathway === "accrual" && !ability) {
    return { status: "error", message: "Please select a difficulty level for the accrual pathway." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = resolveLocale(formData)
  if (!user) {
    redirect(localizePath("/login", locale))
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      pathway,
      ability_level:       pathway === "accrual" ? ability : null,
      onboarding_complete: true,
    })
    .eq("id", user.id)

  if (error) {
    return { status: "error", message: "Could not save your settings. Please try again." }
  }

  redirect(localizePath("/training", locale))
}
