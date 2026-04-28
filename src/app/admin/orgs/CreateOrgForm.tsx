"use client"
// Client component for creating a new organisation.
// On success it shows a confirmation with the generated licence key.
// The key is returned in the server action response so the admin can copy it.

import { useActionState, useState } from "react"
import { createOrg } from "@/app/admin/actions"

type FormState = { error?: string; success?: boolean }
const initialState: FormState = {}

// Pathway each accounting type resolves to — mirrors server logic
const ACCOUNTING_TYPE_LABELS: Record<string, string> = {
  "cash-basis": "Cash Basis (IPSAS C4)",
  "accrual":    "Accrual (IPSAS 1–48)",
  "custom":     "Custom — Solomon Islands (SIG, cash-basis overlay)",
}

// Plan type options. Mirrors the CHECK constraint on organisations.plan_type.
const PLAN_TYPE_LABELS: Record<string, string> = {
  enterprise: "Enterprise — manual invoice (default)",
  beta:       "Beta — 14-day trial",
  team:       "Team — per-seat per-year (Stripe, Phase 2)",
  individual: "Individual — per-seat per-month (Stripe, Phase 2)",
}

export default function CreateOrgForm() {
  const [state, formAction, isPending] = useActionState(createOrg, initialState)
  const [accountingType, setAccountingType] = useState("accrual")

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

      {/* Accounting type — drives pathway for all users in this org */}
      <div>
        <label htmlFor="accounting_type" className="mb-1.5 block text-sm font-medium text-slate-700">
          Accounting type <span className="text-red-500">*</span>
        </label>
        <select
          id="accounting_type"
          name="accounting_type"
          required
          value={accountingType}
          onChange={(e) => setAccountingType(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
        >
          {Object.entries(ACCOUNTING_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">
          Sets the default pathway for all users who register under this organisation.
        </p>
      </div>

      {/* Jurisdiction code — only relevant for custom type */}
      {accountingType === "custom" && (
        <div>
          <label htmlFor="jurisdiction_code" className="mb-1.5 block text-sm font-medium text-slate-700">
            Jurisdiction code <span className="text-red-500">*</span>
          </label>
          <input
            id="jurisdiction_code"
            name="jurisdiction_code"
            type="text"
            required
            defaultValue="SIG"
            placeholder="SIG"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          />
          <p className="mt-1 text-xs text-slate-400">
            SIG = Solomon Islands Government overlay. Add other codes as new custom types are defined.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="plan_type" className="mb-1.5 block text-sm font-medium text-slate-700">
            Plan type <span className="text-red-500">*</span>
          </label>
          <select
            id="plan_type"
            name="plan_type"
            required
            defaultValue="enterprise"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          >
            {Object.entries(PLAN_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Stripe-billed plans (Individual / Team) are wired in Phase 2.
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

      {/* Demo org flag — auto-approves registrations */}
      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          name="demo"
          value="true"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-ppf-sky focus:ring-ppf-sky"
        />
        <span className="text-sm text-slate-700">
          <span className="font-medium">Demo organisation</span>
          <span className="ml-1 text-slate-500">— new registrations are auto-approved (no admin review)</span>
        </span>
      </label>

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
