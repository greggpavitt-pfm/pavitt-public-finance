"use client"
// ReviewerSlot — dropdown to assign/remove a single reviewer slot for an org or subgroup.
// Fires immediately on selection change (no separate Save button).

import { useTransition, useState } from "react"
import type { OrgUser } from "@/app/[locale]/admin/actions"
import { assignOrgReviewer, assignSubgroupReviewer } from "@/app/[locale]/admin/actions"

interface Props {
  label: string
  slot: 1 | 2
  currentUserId: string | null
  orgUsers: OrgUser[]
  targetType: "org" | "subgroup"
  targetId: string
}

export default function ReviewerSlot({
  label,
  slot,
  currentUserId,
  orgUsers,
  targetType,
  targetId,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    const userId = value === "" ? null : value

    setError(null)
    startTransition(async () => {
      const result =
        targetType === "org"
          ? await assignOrgReviewer(targetId, slot, userId)
          : await assignSubgroupReviewer(targetId, slot, userId)

      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400">{label}</span>
      <select
        value={currentUserId ?? ""}
        onChange={handleChange}
        disabled={isPending}
        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 disabled:opacity-60"
      >
        <option value="">— None —</option>
        {orgUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.full_name}
          </option>
        ))}
      </select>
      {isPending && <span className="text-xs text-slate-400">Saving…</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
