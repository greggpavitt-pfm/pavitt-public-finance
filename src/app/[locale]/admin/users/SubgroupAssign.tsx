"use client"
// Subgroup assignment dropdown for a single user row on the users admin page.
// Fires assignUserSubgroup immediately on select change (no submit button needed —
// it's a single-value toggle, same pattern as a status switch).

import { useTransition } from "react"
import { assignUserSubgroup } from "@/app/[locale]/admin/actions"

interface OrgSubgroup {
  id: string
  name: string
}

interface Props {
  userId: string
  currentSubgroupId: string | null
  // Subgroups available for this user's org (may be empty if none defined yet)
  orgSubgroups: OrgSubgroup[]
}

export default function SubgroupAssign({ userId, currentSubgroupId, orgSubgroups }: Props) {
  const [isPending, startTransition] = useTransition()

  // No subgroups defined for this org — nothing to assign
  if (orgSubgroups.length === 0) {
    return <span className="text-xs text-slate-300">—</span>
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedId = e.target.value || null
    startTransition(async () => {
      const result = await assignUserSubgroup(userId, selectedId)
      if (result.error) alert(`Error: ${result.error}`)
    })
  }

  return (
    <select
      defaultValue={currentSubgroupId ?? ""}
      onChange={handleChange}
      disabled={isPending}
      className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-ppf-sky focus:outline-none disabled:opacity-50"
      aria-label="Assign subgroup"
    >
      <option value="">No subgroup</option>
      {orgSubgroups.map((sg) => (
        <option key={sg.id} value={sg.id}>
          {sg.name}
        </option>
      ))}
    </select>
  )
}
