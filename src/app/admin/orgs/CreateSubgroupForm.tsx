"use client"
// Inline form for creating a subgroup within an org.
// Used inside SubgroupPanel — rendered only when the panel is expanded
// and the current admin has permission to create subgroups for this org.

import { useActionState, useRef } from "react"
import { createSubgroup } from "@/app/admin/actions"

type FormState = { error?: string; success?: boolean }
const initialState: FormState = {}

interface Props {
  orgId: string
}

export default function CreateSubgroupForm({ orgId }: Props) {
  const [state, formAction, isPending] = useActionState(createSubgroup, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  // Reset the form after a successful create so the admin can add another
  if (state.success && formRef.current) {
    formRef.current.reset()
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3"
    >
      {/* Hidden — tells the server action which org this subgroup belongs to */}
      <input type="hidden" name="org_id" value={orgId} />

      {state.error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          Subgroup created.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[160px]">
          <label
            htmlFor={`sg-name-${orgId}`}
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Subgroup name <span className="text-red-500">*</span>
          </label>
          <input
            id={`sg-name-${orgId}`}
            name="name"
            type="text"
            required
            placeholder="e.g. Treasury Division"
            className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          />
        </div>

        <div className="flex-1 min-w-[160px]">
          <label
            htmlFor={`sg-jurisdiction-${orgId}`}
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Sub-jurisdiction code
          </label>
          <input
            id={`sg-jurisdiction-${orgId}`}
            name="sub_jurisdiction"
            type="text"
            placeholder="e.g. SIG-TREASURY"
            className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          />
          <p className="mt-0.5 text-xs text-slate-400">
            Leave blank unless this subgroup has its own content layer.
          </p>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-ppf-sky px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-60"
          >
            {isPending ? "Adding…" : "Add subgroup"}
          </button>
        </div>
      </div>
    </form>
  )
}
