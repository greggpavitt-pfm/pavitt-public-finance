"use client"
// Client form for the lead magnet — uses useActionState for the
// progressive-enhancement pattern matching ContactSection.

import { useActionState } from "react"
import Link from "next/link"
import { captureLead, type LeadMagnetState } from "./actions"

const initialState: LeadMagnetState = { status: "idle", message: "" }

export default function LeadMagnetForm() {
  const [state, formAction, isPending] = useActionState(captureLead, initialState)

  if (state.status === "success" && state.downloadUrl) {
    return (
      <div className="mt-5 rounded-md border border-success/30 bg-success-bg p-4">
        <p className="text-sm font-semibold text-success-fg">
          {state.message}
        </p>
        <Link
          href={state.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-4 py-2 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
        >
          Download the checklist
          <span aria-hidden>↓</span>
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-5 space-y-3">
      <input type="hidden" name="source" value="ipsas-checklist" />

      <div>
        <label htmlFor="lead-email" className="sr-only">
          Email address
        </label>
        <input
          id="lead-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@ministry.gov"
          className="w-full rounded-md border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ppf-sky focus:outline-none focus:ring-2 focus:ring-ppf-sky/30"
        />
      </div>

      <label className="flex items-start gap-2 text-[12px] leading-[1.5] text-ink-700">
        <input
          type="checkbox"
          name="consent"
          defaultChecked
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-ppf-sky focus:ring-ppf-sky/30"
        />
        <span>
          Send me the checklist and (occasional) IPSAS practice notes. I can
          unsubscribe any time.
        </span>
      </label>

      {state.status === "error" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ppf-sky px-4 py-2.5 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send me the checklist"}
        {!isPending && <span aria-hidden>→</span>}
      </button>
    </form>
  )
}
