"use client"
// Inline plan-type selector for the admin orgs table.
// Calls updateOrgPlan server action on change; shows a brief saving indicator.

import { useState, useTransition } from "react"
import { updateOrgPlan } from "@/app/admin/actions"

const PLAN_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "beta",       label: "Beta" },
  { value: "individual", label: "Individual" },
  { value: "team",       label: "Team" },
  { value: "enterprise", label: "Enterprise" },
  { value: "expired",    label: "Expired" },
  { value: "suspended",  label: "Suspended" },
]

export default function PlanTypeSelect({
  orgId,
  currentPlan,
}: {
  orgId: string
  currentPlan: string
}) {
  const [plan, setPlan] = useState(currentPlan)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <select
        value={plan}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value
          const previous = plan
          setPlan(next)
          setError(null)
          startTransition(async () => {
            const res = await updateOrgPlan(orgId, next)
            if (res.error) {
              setError(res.error)
              setPlan(previous)
            }
          })
        }}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky disabled:opacity-50"
      >
        {PLAN_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {isPending && <span className="text-xs text-slate-400">saving…</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
