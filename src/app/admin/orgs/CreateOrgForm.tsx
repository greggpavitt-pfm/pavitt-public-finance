"use client"
// Client component for creating a new organisation.
// On success it shows a confirmation with the generated licence key.
// The key is returned in the server action response so the admin can copy it.

import { useActionState } from "react"
import { createOrg } from "@/app/admin/actions"

type FormState = { error?: string; success?: boolean }
const initialState: FormState = {}

export default function CreateOrgForm() {
  const [state, formAction, isPending] = useActionState(createOrg, initialState)

  if (state.success) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
        <p className="font-semibold">Organisation created.</p>
        <p className="mt-1 text-green-700">
          The licence key has been generated. Refresh the page to see it in the table below.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Organisation name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ministry of Finance"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          />
        </div>

        <div>
          <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-slate-700">
            Country <span className="text-red-500">*</span>
          </label>
          <input
            id="country"
            name="country"
            type="text"
            required
            placeholder="Solomon Islands"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="jurisdiction_code" className="mb-1.5 block text-sm font-medium text-slate-700">
            Jurisdiction code
          </label>
          <input
            id="jurisdiction_code"
            name="jurisdiction_code"
            type="text"
            placeholder="SIG  (leave blank for universal content)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          />
          <p className="mt-1 text-xs text-slate-400">
            SIG = Solomon Islands Government overlay. Leave blank for universal IPSAS content only.
          </p>
        </div>

        <div>
          <label htmlFor="max_users" className="mb-1.5 block text-sm font-medium text-slate-700">
            Max users
          </label>
          <input
            id="max_users"
            name="max_users"
            type="number"
            min="1"
            placeholder="Leave blank for unlimited"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-ppf-sky px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create organisation"}
        </button>
      </div>
    </form>
  )
}
