"use client"
// Client component for the login form.
// useActionState wires the form to the server action and handles the pending/error states.

import { useActionState } from "react"
import { loginUser, type AuthFormState } from "@/app/auth/actions"

const initialState: AuthFormState = { status: "idle", message: "" }

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginUser, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-5">
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
