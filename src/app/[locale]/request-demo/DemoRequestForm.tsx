"use client"
// Demo-request form (client component).
//
// Honeypot field "website" is rendered off-screen — bots fill every visible
// input plus the honeypot; humans never see it. Server rejects submissions
// where the honeypot is non-empty.

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { submitDemoRequest, type DemoRequestInput, type DemoRequestResult } from "./actions"

export default function DemoRequestForm() {
  const t = useTranslations("RequestDemo")
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
          {t("success.trialNote")}
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
          {t("form.websiteHoneypotLabel")}
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
        <Field label={t("form.orgNameLabel")}>
          <input
            type="text"
            required
            value={form.org_name}
            onChange={(e) => update("org_name", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={t("form.countryLabel")}>
          <input
            type="text"
            required
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={t("form.yourNameLabel")}>
          <input
            type="text"
            required
            value={form.contact_name}
            onChange={(e) => update("contact_name", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={t("form.workEmailLabel")}>
          <input
            type="email"
            required
            value={form.contact_email}
            onChange={(e) => update("contact_email", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={t("form.yourRoleLabel")}>
          <input
            type="text"
            value={form.role ?? ""}
            onChange={(e) => update("role", e.target.value)}
            placeholder={t("form.yourRolePlaceholder")}
            className={inputCls}
          />
        </Field>
        <Field label={t("form.expectedUsersLabel")}>
          <input
            type="number"
            min={1}
            max={10000}
            value={form.expected_users ?? ""}
            onChange={(e) => update("expected_users", e.target.value ? Number(e.target.value) : undefined)}
            className={inputCls}
          />
        </Field>
        <Field label={t("form.accountingFrameworkLabel")}>
          <select
            value={form.accounting_type ?? ""}
            onChange={(e) => update("accounting_type", (e.target.value || undefined) as DemoRequestInput["accounting_type"])}
            className={inputCls}
          >
            <option value="">{t("form.accountingSelectPlaceholder")}</option>
            <option value="cash-basis">{t("form.accountingCashBasis")}</option>
            <option value="accrual">{t("form.accountingAccrual")}</option>
            <option value="custom">{t("form.accountingCustom")}</option>
          </select>
        </Field>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-md bg-ppf-sky px-5 py-2.5 text-sm font-semibold text-white hover:bg-ppf-sky-hover disabled:opacity-60"
      >
        {pending ? t("form.submitting") : t("form.submitButton")}
      </button>

      {result && !result.ok && (
        <p className="mt-4 text-sm text-red-700">{result.message}</p>
      )}

      <p className="mt-4 text-xs text-slate-500">
        {t("form.responseNote")}
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
