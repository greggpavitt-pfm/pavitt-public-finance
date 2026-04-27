"use client"
// Client component for the approve/suspend/blacklist/guest-renew buttons.
// Uses useTransition so buttons show a loading state while the server action runs.
//
// The DANGER ZONE expander at the bottom is rendered for super_admin only and
// hosts irreversible operations (currently: permanent delete). Email-typed
// confirmation is required server-side as well — the UI guard is convenience.

import { useState, useTransition } from "react"
import {
  approveUser,
  suspendUser,
  reinstateUser,
  blacklistUser,
  renewGuestAccount,
  cancelGuestAccount,
  deleteUserPermanently,
} from "@/app/admin/actions"

interface Props {
  userId: string
  userEmail: string                    // shown in delete confirm prompt
  currentStatus: "pending" | "approved" | "suspended"
  accountType: "guest" | "standard"
  blacklisted: boolean
  isSuperAdmin: boolean                // gates Danger Zone visibility
}

export default function UserActions({
  userId,
  userEmail,
  currentStatus,
  accountType,
  blacklisted,
  isSuperAdmin,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [dangerOpen, setDangerOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")

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

  function handleDelete() {
    // Belt + braces: server still re-checks the typed email matches.
    if (confirmEmail.trim().toLowerCase() !== userEmail.toLowerCase()) {
      alert("Typed email does not match the user's email.")
      return
    }
    if (!confirm(
      `PERMANENTLY DELETE ${userEmail}?\n\n` +
      `This removes the auth user, profile, and admin role. ` +
      `It cannot be undone. Use Blacklist instead if the user has any history.`,
    )) return
    startTransition(async () => {
      const result = await deleteUserPermanently(userId, confirmEmail)
      if (result.error) {
        const detail = result.blockers?.length
          ? `\n\nBlockers:\n• ${result.blockers.join("\n• ")}`
          : ""
        alert(`${result.error}${detail}`)
        return
      }
      // Success — row vanishes on revalidate; collapse the panel.
      setDangerOpen(false)
      setConfirmEmail("")
    })
  }

  if (blacklisted) {
    return (
      <div className="flex flex-col gap-2">
        <span className="inline-block w-fit rounded-full bg-red-900 px-2.5 py-0.5 text-xs font-semibold text-white">
          Blacklisted
        </span>
        {isSuperAdmin && (
          <DangerZone
            userEmail={userEmail}
            confirmEmail={confirmEmail}
            setConfirmEmail={setConfirmEmail}
            dangerOpen={dangerOpen}
            setDangerOpen={setDangerOpen}
            isPending={isPending}
            onDelete={handleDelete}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
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

    {/* Danger Zone — super_admin only. Hard delete with email-typed confirm. */}
    {isSuperAdmin && (
      <DangerZone
        userEmail={userEmail}
        confirmEmail={confirmEmail}
        setConfirmEmail={setConfirmEmail}
        dangerOpen={dangerOpen}
        setDangerOpen={setDangerOpen}
        isPending={isPending}
        onDelete={handleDelete}
      />
    )}
    </div>
  )
}

// Collapsible red-bordered panel containing irreversible operations.
// Today: permanent delete. Future destructive ops can join here.
interface DangerZoneProps {
  userEmail: string
  confirmEmail: string
  setConfirmEmail: (s: string) => void
  dangerOpen: boolean
  setDangerOpen: (b: boolean) => void
  isPending: boolean
  onDelete: () => void
}

function DangerZone({
  userEmail,
  confirmEmail,
  setConfirmEmail,
  dangerOpen,
  setDangerOpen,
  isPending,
  onDelete,
}: DangerZoneProps) {
  return (
    <div className="rounded border border-red-300 bg-red-50/50">
      <button
        type="button"
        onClick={() => setDangerOpen(!dangerOpen)}
        className="flex w-full items-center justify-between px-2 py-1 text-left text-xs font-semibold text-red-800 hover:bg-red-100"
      >
        <span>⚠ Danger Zone</span>
        <span aria-hidden>{dangerOpen ? "▾" : "▸"}</span>
      </button>
      {dangerOpen && (
        <div className="border-t border-red-200 p-2 space-y-2">
          <p className="text-[11px] leading-tight text-red-900">
            Permanent delete removes the user entirely (auth + profile + admin role).
            Refused if the user has any history — use Blacklist instead.
            Type <code className="font-mono">{userEmail}</code> to confirm.
          </p>
          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={userEmail}
            disabled={isPending}
            className="w-full rounded border border-red-300 px-2 py-1 text-xs font-mono"
          />
          <button
            onClick={onDelete}
            disabled={isPending || confirmEmail.trim().toLowerCase() !== userEmail.toLowerCase()}
            className="w-full rounded bg-red-700 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "Deleting…" : "Permanently Delete"}
          </button>
        </div>
      )}
    </div>
  )
}
