"use client"
// Revoke button for the admin users list. Super admin only.

import { useTransition } from "react"
import { revokeAdminRole } from "@/app/[locale]/admin/actions"

interface Props {
  targetUserId: string
  targetName: string
}

export default function AdminRoleActions({ targetUserId, targetName }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleRevoke() {
    if (!confirm(`Revoke admin access for ${targetName}? They will become a regular user immediately.`)) return
    startTransition(async () => {
      const result = await revokeAdminRole(targetUserId)
      if (result.error) alert(`Error: ${result.error}`)
    })
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={isPending}
      className="rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? "…" : "Revoke"}
    </button>
  )
}
