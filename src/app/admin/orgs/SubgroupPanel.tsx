"use client"
// Expandable panel showing the subgroups for a single org.
// Toggled open/closed by the "Subgroups (N)" button in the org table row.
// Handles delete via useTransition, and shows CreateSubgroupForm when open.

import { useState, useTransition } from "react"
import type { Subgroup, OrgUser } from "@/app/admin/actions"
import { deleteSubgroup } from "@/app/admin/actions"
import CreateSubgroupForm from "./CreateSubgroupForm"
import ReviewerSlot from "./ReviewerSlot"

interface Props {
  orgId: string
  subgroups: Subgroup[]
  orgUsers: OrgUser[]
  // canCreate is true if the current admin is super_admin OR is org_admin for this org
  canCreate: boolean
}

export default function SubgroupPanel({ orgId, subgroups, orgUsers, canCreate }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete(subgroupId: string, subgroupName: string) {
    if (!confirm(`Delete subgroup "${subgroupName}"? This cannot be undone.`)) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteSubgroup(subgroupId)
      if (result.error) setDeleteError(result.error)
      // revalidatePath in the action refreshes the page data automatically
    })
  }

  return (
    <div className="inline-block">
      {/* Toggle button — shows in the org table row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-ppf-sky hover:text-ppf-sky"
      >
        {open ? "▲" : "▼"} Subgroups ({subgroups.length})
      </button>

      {open && (
        <div className="mt-2 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm">
          {deleteError && (
            <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {deleteError}
            </div>
          )}

          {subgroups.length === 0 ? (
            <p className="text-xs text-slate-400">No subgroups yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-1.5 font-semibold">Name</th>
                  <th className="pb-1.5 font-semibold">Sub-jurisdiction</th>
                  <th className="pb-1.5 font-semibold">Reviewer 1</th>
                  <th className="pb-1.5 font-semibold">Reviewer 2</th>
                  <th className="pb-1.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subgroups.map((sg) => (
                  <tr key={sg.id} className="align-top">
                    <td className="py-1.5 pr-4 font-medium text-ppf-navy">{sg.name}</td>
                    <td className="py-1.5 pr-4 font-mono text-slate-500">
                      {sg.sub_jurisdiction ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-1.5 pr-3">
                      {canCreate ? (
                        <ReviewerSlot
                          label=""
                          slot={1}
                          currentUserId={sg.reviewer_1_id ?? null}
                          orgUsers={orgUsers}
                          targetType="subgroup"
                          targetId={sg.id}
                        />
                      ) : (
                        <span className="text-slate-500">
                          {orgUsers.find((u) => u.id === sg.reviewer_1_id)?.full_name ?? <span className="text-slate-300">—</span>}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3">
                      {canCreate ? (
                        <ReviewerSlot
                          label=""
                          slot={2}
                          currentUserId={sg.reviewer_2_id ?? null}
                          orgUsers={orgUsers}
                          targetType="subgroup"
                          targetId={sg.id}
                        />
                      ) : (
                        <span className="text-slate-500">
                          {orgUsers.find((u) => u.id === sg.reviewer_2_id)?.full_name ?? <span className="text-slate-300">—</span>}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(sg.id, sg.name)}
                        disabled={isPending}
                        className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {canCreate && <CreateSubgroupForm orgId={orgId} />}
        </div>
      )}
    </div>
  )
}
