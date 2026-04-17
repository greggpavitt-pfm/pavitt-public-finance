"use client"
// Client component for the registration form.
// The pathway field controls whether the difficulty selector is shown —
// it's only relevant for the accrual pathway (cash-basis is a single level).

import { useActionState, useState } from "react"
import { registerUser, type AuthFormState } from "@/app/auth/actions"

interface Org {
  id: string
  name: string
  country: string
}

interface Props {
  orgs: Org[]
}

const initialState: AuthFormState = { status: "idle", message: "" }

export default function RegisterForm({ orgs }: Props) {
  const [state, formAction, isPending] = useActionState(registerUser, initialState)
  // Track selected pathway so we can show/hide the difficulty dropdown
  const [pathway, setPathway] = useState("")

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Error banner */}
      {state.status === "error" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Name + job title on one row on wider screens */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label htmlFor="job_title" className="mb-1.5 block text-sm font-medium text-slate-700">
            Job title
          </label>
          <input
            id="job_title"
            name="job_title"
            type="text"
            autoComplete="organization-title"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
            placeholder="e.g. Senior Accountant"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Email address <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          placeholder="At least 8 characters"
        />
      </div>

      {/* Organisation / registration type */}
      <div>
        <label htmlFor="org_id" className="mb-1.5 block text-sm font-medium text-slate-700">
          Organisation <span className="text-red-500">*</span>
        </label>
        <select
          id="org_id"
          name="org_id"
          required
          defaultValue=""
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
        >
          <option value="" disabled>— Select your organisation —</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}{org.country ? `, ${org.country}` : ""}
            </option>
          ))}
          {/* Beta tester option — shown below a visual separator */}
          <optgroup label="Other">
            <option value="beta">Beta tester (independent)</option>
          </optgroup>
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          If your organisation is not listed, select &ldquo;Beta tester&rdquo; to register independently.
          Your account will be reviewed before access is granted.
        </p>
      </div>

      {/* Pathway */}
      <div>
        <label htmlFor="pathway" className="mb-1.5 block text-sm font-medium text-slate-700">
          Basis of accounting <span className="text-red-500">*</span>
        </label>
        <select
          id="pathway"
          name="pathway"
          required
          value={pathway}
          onChange={(e) => setPathway(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
        >
          <option value="">— Select a pathway —</option>
          <option value="accrual">Accrual basis (IPSAS 1–48)</option>
          <option value="cash-basis">Cash basis (IPSAS C4)</option>
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          Choose the accounting basis your organisation uses or is transitioning to.
        </p>
      </div>

      {/* Difficulty — only shown when pathway is accrual */}
      {pathway === "accrual" && (
        <div>
          <label htmlFor="ability_level" className="mb-1.5 block text-sm font-medium text-slate-700">
            Starting level <span className="text-red-500">*</span>
          </label>
          <select
            id="ability_level"
            name="ability_level"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          >
            <option value="">— Select a level —</option>
            <option value="beginner">Beginner — new to IPSAS accrual</option>
            <option value="intermediate">Intermediate — familiar with the basics</option>
            <option value="advanced">Advanced — working with complex standards</option>
          </select>
          <p className="mt-1.5 text-xs text-slate-500">
            You can change this later from your profile.
          </p>
        </div>
      )}

      {/* Product access — which part of the platform the user needs */}
      <div>
        <label htmlFor="product_access" className="mb-1.5 block text-sm font-medium text-slate-700">
          What will you use this for? <span className="text-red-500">*</span>
        </label>
        <select
          id="product_access"
          name="product_access"
          required
          defaultValue=""
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
        >
          <option value="" disabled>— Select access type —</option>
          <option value="training">Training modules (student)</option>
          <option value="advisor">Practitioner Advisor (Q&amp;A)</option>
          <option value="both">Both training and advisor</option>
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          You can use both products once your account is approved.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-ppf-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-60"
      >
        {isPending ? "Creating account…" : "Create account"}
      </button>
    </form>
  )
}
