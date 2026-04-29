"use client"
// Demo-request form (client component).
//
// Honeypot field "website" is rendered off-screen — bots fill every visible
// input plus the honeypot; humans never see it. Server rejects submissions
// where the honeypot is non-empty.

import { useState, useTransition } from "react"
import { submitDemoRequest, type DemoRequestInput, type DemoRequestResult } from "./actions"

export default function DemoRequestForm() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<DemoRequestResult | null>(null)
  const [form, setForm] = useState<DemoRequestInput>({
    org_name: "",
    country: "",
    contact_name: "",
    contact_email: "",
    role: "",
    expected_users: undefined,
    accounting_type: undefined,
    website: "",
  })

  function update<K extends keyof DemoRequestInput>(key: K, value: DemoRequestInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const r = await submitDemoRequest(form)
      setResult(r)
      if (r.ok) {
        setForm({
          org_name: "", country: "", contact_name: "", contact_email: "",
          role: "", expected_users: undefined, accounting_type: undefined, website: "",
        })
      }
    })
  }

  if (result?.ok) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-green-900">
        <p className="text-lg font-semibold">{result.message}</p>
        <p className="mt-2 text-sm">
          You&apos;ll receive a sign-in email once your trial organisation is set up.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-ppf-sky/20 bg-white p-6 shadow-sm"
    >
      {/* Honeypot — keep visually hidden but not display:none (some bots skip those) */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}>
        <label>
          Website (leave blank)
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website ?? ""}
            onChange={(e) => update("website", e.target.value)}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Organisation name *">
          <input
            type="text"
            required
            value={form.org_name}
            onChange={(e) => update("org_name", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Country *">
          <input
            type="text"
            required
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Your name *">
          <input
            type="text"
            required
            value={form.contact_name}
            onChange={(e) => update("contact_name", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Work email *">
          <input
            type="email"
            required
            value={form.contact_email}
            onChange={(e) => update("contact_email", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Your role">
          <input
            type="text"
            value={form.role ?? ""}
            onChange={(e) => update("role", e.target.value)}
            placeholder="e.g. Director of Treasury"
            className={inputCls}
          />
        </Field>
        <Field label="Expected users (1–10000)">
          <input
            type="number"
            min={1}
            max={10000}
            value={form.expected_users ?? ""}
            onChange={(e) => update("expected_users", e.target.value ? Number(e.target.value) : undefined)}
            className={inputCls}
          />
        </Field>
        <Field label="Accounting framework">
          <select
            value={form.accounting_type ?? ""}
            onChange={(e) => update("accounting_type", (e.target.value || undefined) as DemoRequestInput["accounting_type"])}
            className={inputCls}
          >
            <option value="">— Select —</option>
            <option value="cash-basis">Cash-basis IPSAS</option>
            <option value="accrual">Accrual IPSAS</option>
            <option value="custom">Custom jurisdiction</option>
          </select>
        </Field>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-md bg-ppf-sky px-5 py-2.5 text-sm font-semibold text-white hover:bg-ppf-sky-hover disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Request trial"}
      </button>

      {result && !result.ok && (
        <p className="mt-4 text-sm text-red-700">{result.message}</p>
      )}

      <p className="mt-4 text-xs text-slate-500">
        We respond within one business day (Australia / Pacific time).
      </p>
    </form>
  )
}

const inputCls =
  "w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-ppf-sky focus:outline-none"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      {children}
    </div>
  )
}
