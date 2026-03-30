// Form to create a regulation subgroup in IPSAS with sub_jurisdiction code

"use client"

import { useActionState, useRef } from "react"
import { createIpsasSubgroup } from "@/app/admin/actions"

interface CreateIpsasSubgroupFormProps {
  orgId: string
}

export default function CreateIpsasSubgroupForm({ orgId }: CreateIpsasSubgroupFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(createIpsasSubgroup, {})

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    formAction(new FormData(form))
    if (state.success) {
      form.reset()
    }
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="org_id" value={orgId} />

      <div>
        <label className="block text-sm font-medium text-slate-700">Subgroup Name</label>
        <input
          type="text"
          name="name"
          placeholder="e.g., Finance Department, Treasury Board"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Sub-Jurisdiction Code</label>
        <input
          type="text"
          name="sub_jurisdiction"
          placeholder="e.g., SIG-TREASURY, SIG-PARLIAMENT"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          required
        />
        <p className="mt-1 text-xs text-slate-500">
          This code gates which IPSAS modules are visible to users in this subgroup.
        </p>
      </div>

      {state.error && (
        <div className="rounded border-l-4 border-red-400 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded border-l-4 border-green-400 bg-green-50 p-3 text-sm text-green-700">
          Subgroup created successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-ppf-sky px-3 py-2 text-sm font-medium text-white hover:bg-ppf-blue disabled:opacity-60"
      >
        {isPending ? "Creating..." : "Create Subgroup"}
      </button>
    </form>
  )
}
