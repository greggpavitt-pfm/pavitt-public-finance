"use client"
// Bulk approve bar — shows above the users table. Tracks which rows are
// checked via a shared event listener on every checkbox in the table that
// has `data-bulk-approve-pending="true"` (set by page.tsx for pending rows).
// Calling bulkApproveUsers() with the collected ids approves them in one
// server round-trip.

import { useEffect, useState, useTransition } from "react"
import { bulkApproveUsers } from "@/app/[locale]/admin/actions"

export default function BulkApproveBar() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)

  // Wire up listeners to checkboxes rendered server-side. Re-runs on mount;
  // because the table is server-rendered, the boxes exist before this runs.
  useEffect(() => {
    const boxes = document.querySelectorAll<HTMLInputElement>(
      'input[data-bulk-approve-pending="true"]'
    )

    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement
      const id = t.dataset.userId
      if (!id) return
      setSelected((prev) => {
        const next = new Set(prev)
        if (t.checked) next.add(id)
        else next.delete(id)
        return next
      })
    }

    boxes.forEach((b) => b.addEventListener("change", onChange))
    return () => {
      boxes.forEach((b) => b.removeEventListener("change", onChange))
    }
  }, [])

  if (selected.size === 0 && !feedback) return null

  function handleApprove() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (!window.confirm(`Approve ${ids.length} user${ids.length === 1 ? "" : "s"}?`)) return

    startTransition(async () => {
      const result = await bulkApproveUsers(ids)
      if (result.error) {
        setFeedback(`Error: ${result.error}`)
      } else {
        setFeedback(`Approved ${result.approved} user${result.approved === 1 ? "" : "s"}.`)
        // Uncheck every box and clear local state.
        document
          .querySelectorAll<HTMLInputElement>('input[data-bulk-approve-pending="true"]')
          .forEach((b) => { b.checked = false })
        setSelected(new Set())
      }
    })
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      {selected.size > 0 && (
        <>
          <span className="font-medium text-amber-900">
            {selected.size} pending user{selected.size === 1 ? "" : "s"} selected
          </span>
          <button
            type="button"
            onClick={handleApprove}
            disabled={pending}
            className="rounded-md bg-ppf-sky px-3 py-1.5 text-xs font-semibold text-white hover:bg-ppf-sky-hover disabled:opacity-60"
          >
            {pending ? "Approving…" : `Approve ${selected.size} selected`}
          </button>
        </>
      )}
      {feedback && (
        <span className={feedback.startsWith("Error") ? "text-red-700" : "text-green-700"}>
          {feedback}
        </span>
      )}
    </div>
  )
}
