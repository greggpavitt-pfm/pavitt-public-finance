"use server"
// Server actions for authentication — register, login, logout, onboarding.
// These run on the server only and use the Supabase clients from src/lib/supabase/.
//
// Key security notes:
//   - Licence key validation uses createServiceClient() so it bypasses RLS
//     (the organisations table has no public SELECT policy by design).
//   - All other writes use the anon client with the user's session.

import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export interface AuthFormState {
  status: "idle" | "success" | "error"
  message: string
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
// Creates a Supabase auth user, then inserts a profiles row with account_status
// = 'pending'. The user cannot access /training until an admin approves them.

export async function registerUser(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email      = (formData.get("email")        as string | null)?.trim() ?? ""
  const password   = (formData.get("password")     as string | null) ?? ""
  const fullName   = (formData.get("full_name")    as string | null)?.trim() ?? ""
  const jobTitle   = (formData.get("job_title")    as string | null)?.trim() ?? ""
  const licenceKey = (formData.get("licence_key")  as string | null)?.trim() ?? ""
  const pathway    = (formData.get("pathway")      as string | null) ?? ""
  const ability    = (formData.get("ability_level") as string | null) ?? ""

  // --- Basic validation ---
  if (!email || !password || !fullName || !licenceKey || !pathway) {
    return { status: "error", message: "Please fill in all required fields." }
  }
  if (pathway === "accrual" && !ability) {
    return { status: "error", message: "Please select a difficulty level for the accrual pathway." }
  }
  if (password.length < 8) {
    return { status: "error", message: "Password must be at least 8 characters." }
  }

  // --- Look up the licence key (service client bypasses RLS) ---
  const serviceClient = await createServiceClient()
  const { data: org, error: orgError } = await serviceClient
    .from("organisations")
    .select("id")
    .eq("licence_key", licenceKey)
    .in("licence_status", ["beta", "active"])
    .single()

  if (orgError || !org) {
    return { status: "error", message: "Licence key not recognised. Please check with your organisation administrator." }
  }

  // --- Create the auth user ---
  const supabase = await createClient()
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
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
  const { error: profileError } = await serviceClient
    .from("profiles")
    .insert({
      id:                 userId,
      full_name:          fullName,
      job_title:          jobTitle || null,
      org_id:             org.id,
      pathway:            pathway,
      ability_level:      pathway === "accrual" ? ability : null,
      account_status:     "pending",
      onboarding_complete: false,
    })

  if (profileError) {
    // If profile insert fails, the auth user is orphaned — log it so it can be cleaned up.
    console.error("Profile insert failed for user", userId, profileError)
    return { status: "error", message: "Account setup failed. Please contact support." }
  }

  // Redirect to the pending page — the user cannot log in to /training until approved.
  redirect("/pending")
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
// Signs the user in. Middleware handles redirecting based on their profile state
// (pending → /pending, onboarding incomplete → /onboarding, approved → /training).

export async function loginUser(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email    = (formData.get("email")    as string | null)?.trim() ?? ""
  const password = (formData.get("password") as string | null) ?? ""

  if (!email || !password) {
    return { status: "error", message: "Please enter your email and password." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { status: "error", message: "Incorrect email or password. Please try again." }
  }

  // Middleware will redirect them to the right page based on profile state.
  redirect("/training")
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logoutUser(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
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
  if (!user) {
    redirect("/login")
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

  redirect("/training")
}
