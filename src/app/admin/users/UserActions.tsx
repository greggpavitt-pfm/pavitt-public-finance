"use client"
// Client component for the approve/suspend/blacklist/guest-renew buttons.
// Uses useTransition so buttons show a loading state while the server action runs.

import { useTransition } from "react"
import {
  approveUser,
  suspendUser,
  reinstateUser,
  blacklistUser,
  renewGuestAccount,
  cancelGuestAccount,
} from "@/app/admin/actions"

interface Props {
  userId: string
  currentStatus: "pending" | "approved" | "suspended"
  accountType: "guest" | "standard"
  blacklisted: boolean
}

export default function UserActions({ userId, currentStatus, accountType, blacklisted }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      const result = await approveUser(userId)
      if (result.error) alert(`Error: ${result.error}`)
    })
  }

  function handleSuspend() {
    if (!confirm("Suspend this user? They will be signed out on their next request.")) return
    startTransition(async () => {
      const result = await suspendUser(userId)
      if (result.error) alert(`Error: ${result.error}`)
    })
  }

  function handleReinstate() {
    if (!confirm("Reinstate this user? They will regain access immediately.")) return
    startTransition(async () => {
      const result = await reinstateUser(userId)
      if (result.error) alert(`Error: ${result.error}`)
    })
  }

  function handleBlacklist() {
    if (!confirm("Permanently blacklist this user? This cannot be undone from the panel.")) return
    startTransition(async () => {
      const result = await blacklistUser(userId)
      if (result.error) alert(`Error: ${result.error}`)
    })
  }

  function handleRenewGuest() {
    startTransition(async () => {
      const result = await renewGuestAccount(userId)
      if (result.error) alert(`Error: ${result.error}`)
    })
  }

  function handleCancelGuest() {
    if (!confirm("Cancel guest account? The user will be suspended and may re-register as a standard user.")) return
    startTransition(async () => {
      const result = await cancelGuestAccount(userId)
      if (result.error) alert(`Error: ${result.error}`)
    })
  }

  if (blacklisted) {
    return (
      <span className="inline-block rounded-full bg-red-900 px-2.5 py-0.5 text-xs font-semibold text-white">
        Blacklisted
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Guest-specific controls */}
      {accountType === "guest" && (
        <>
          <button
            onClick={handleRenewGuest}
            disabled={isPending}
            className="rounded bg-ppf-sky px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-50"
          >
            {isPending ? "…" : "Renew +7d"}
          </button>
          <button
            onClick={handleCancelGuest}
            disabled={isPending}
            className="rounded border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50"
          >
            {isPending ? "…" : "Cancel Guest"}
          </button>
        </>
      )}

      {/* Standard approve (pending only) */}
      {currentStatus === "pending" && accountType !== "guest" && (
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "…" : "Approve"}
        </button>
      )}

      {/* Reinstate suspended */}
      {currentStatus === "suspended" && (
        <button
          onClick={handleReinstate}
          disabled={isPending}
          className="rounded bg-ppf-sky px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-50"
        >
          {isPending ? "…" : "Reinstate"}
        </button>
      )}

      {/* Suspend active accounts */}
      {currentStatus !== "suspended" && (
        <button
          onClick={handleSuspend}
          disabled={isPending}
          className="rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {isPending ? "…" : "Suspend"}
        </button>
      )}

      {/* Blacklist (any non-blacklisted account) */}
      <button
        onClick={handleBlacklist}
        disabled={isPending}
        className="rounded border border-red-800 px-3 py-1 text-xs font-semibold text-red-800 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? "…" : "Blacklist"}
      </button>
    </div>
  )
}
