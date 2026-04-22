"use client"

import { useEffect } from "react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold text-[var(--ppf-navy)]">
        Something went wrong loading the admin panel.
      </h2>
      <p className="text-sm text-[var(--ink-muted)]">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-[var(--ppf-navy)] px-4 py-2 text-sm text-white hover:opacity-90"
      >
        Try again
      </button>
    </div>
  )
}
