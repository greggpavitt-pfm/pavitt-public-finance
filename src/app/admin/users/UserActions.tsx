"use client"
// Client component for the approve/suspend buttons on the user list.
// Uses useTransition so the button shows a loading state while the server
// action runs, without needing useActionState (there's no form here).

import { useTransition } from "react"
import { approveUser, suspendUser } from "@/app/admin/actions"

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
      {currentStatus !== "suspended" && (
        <button
          onClick={handleSuspend}
          disabled={isPending}
          className="rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {isPending ? "…" : "Suspend"}
        </button>
      )}
      {currentStatus === "suspended" && (
        <span className="text-xs text-slate-400">Suspended</span>
      )}
    </div>
  )
}
