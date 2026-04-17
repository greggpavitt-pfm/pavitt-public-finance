"use client"
// Client component for the login form.
// useActionState wires the form to the server action and handles the pending/error states.

import { useActionState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { loginUser, type AuthFormState } from "@/app/auth/actions"
import { createClient } from "@/lib/supabase/client"

const initialState: AuthFormState = { status: "idle", message: "" }

interface Props {
  // Where to send the user after a successful login.
  // Defaults to /training (student path). Pass /advisor for practitioners.
  redirectTo?: string
}

export default function LoginForm({ redirectTo = "/training" }: Props) {
  const [state, formAction, isPending] = useActionState(loginUser, initialState)
  const searchParams = useSearchParams()

  // When middleware redirects a suspended user to /login?reason=suspended it
  // cannot call signOut() itself (Edge Runtime restriction). We do it here
  // client-side as soon as the login page mounts with that query param.
  useEffect(() => {
    if (searchParams.get("reason") === "suspended") {
      const supabase = createClient()
      supabase.auth.signOut()
    }
  }, [searchParams])

  // Show a banner for the suspended-account redirect
  const isSuspended = searchParams.get("reason") === "suspended"
  // Show a banner when the email confirmation link was invalid or expired
  const isConfirmationFailed = searchParams.get("error") === "confirmation_failed"

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Hidden field tells the server action where to redirect after login */}
      <input type="hidden" name="redirect_to" value={redirectTo} />
      {/* Suspended-account banner */}
      {isSuspended && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your account has been suspended. Please contact support.
        </div>
      )}

      {/* Expired/invalid confirmation link banner */}
      {isConfirmationFailed && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          The confirmation link has expired or is invalid. Please register again or contact support.
        </div>
      )}

      {/* Error banner */}
      {state.status === "error" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-ppf-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  )
}
