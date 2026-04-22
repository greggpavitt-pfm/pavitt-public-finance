"use client"
// Client component for the approve/suspend buttons on the user list.
// Uses useTransition so the button shows a loading state while the server
// action runs, without needing useActionState (there's no form here).

import { useTransition } from "react"
import { approveUser, suspendUser, reinstateUser } from "@/app/admin/actions"

interface Props {
  userId: string
  currentStatus: "pending" | "approved" | "suspended"
}

export default function UserActions({ userId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      const result = await approveUser(userId)
      if (result.error) alert(`Error: ${result.error}`)
      // revalidatePath in the action will refresh the page data automatically
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

  return (
    <div className="flex gap-2">
      {currentStatus !== "approved" && (
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "…" : "Approve"}
        </button>
      )}
      {currentStatus === "suspended" && (
        <button
          onClick={handleReinstate}
          disabled={isPending}
          className="rounded bg-ppf-sky px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-50"
        >
          {isPending ? "…" : "Reinstate"}
        </button>
      )}
      {currentStatus !== "suspended" && (
        <button
          onClick={handleSuspend}
          disabled={isPending}
          className="rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {isPending ? "…" : "Suspend"}
        </button>
      )}
    </div>
  )
}
