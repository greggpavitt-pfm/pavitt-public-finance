"use client"
// OrgReviewerPanel — expandable panel to assign/view org-level reviewers.
// Same expand/collapse pattern as SubgroupPanel.

import { useState } from "react"
import type { OrgUser } from "@/app/admin/actions"
import ReviewerSlot from "./ReviewerSlot"

interface Props {
  orgId: string
  reviewer1Id: string | null
  reviewer2Id: string | null
  orgUsers: OrgUser[]
  canManage: boolean
}

export default function OrgReviewerPanel({
  orgId,
  reviewer1Id,
  reviewer2Id,
  orgUsers,
  canManage,
}: Props) {
  const [open, setOpen] = useState(false)

  const assignedCount = (reviewer1Id ? 1 : 0) + (reviewer2Id ? 1 : 0)

  // Lookup helper — display a user's name from id
  function nameFor(id: string | null) {
    if (!id) return null
    return orgUsers.find((u) => u.id === id)?.full_name ?? "Unknown"
  }

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-ppf-sky hover:text-ppf-sky"
      >
        {open ? "▲" : "▼"} Reviewers ({assignedCount}/2)
      </button>

      {open && (
        <div className="mt-2 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm">
          {canManage ? (
            <div className="flex flex-col gap-3">
              <ReviewerSlot
                label="Reviewer 1"
                slot={1}
                currentUserId={reviewer1Id}
                orgUsers={orgUsers}
                targetType="org"
                targetId={orgId}
              />
              <ReviewerSlot
                label="Reviewer 2"
                slot={2}
                currentUserId={reviewer2Id}
                orgUsers={orgUsers}
                targetType="org"
                targetId={orgId}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Reviewer 1: </span>
                {nameFor(reviewer1Id) ?? <span className="text-slate-300">— None —</span>}
              </div>
              <div>
                <span className="text-slate-400">Reviewer 2: </span>
                {nameFor(reviewer2Id) ?? <span className="text-slate-300">— None —</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
