"use client"
// Client component for the registration form.
// When an org is selected, pathway is derived server-side from the org's accounting_type.
// The pathway selector is only shown for beta testers (no org) who must choose manually.

import { useActionState, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { registerUser, type AuthFormState } from "@/app/auth/actions"

interface Org {
  id: string
  name: string
  country: string
  accounting_type: string
  demo: boolean
}

interface Props {
  orgs: Org[]
}

const initialState: AuthFormState = { status: "idle", message: "" }

export default function RegisterForm({ orgs }: Props) {
  const t = useTranslations("Register")
  const locale = useLocale()
  const [state, formAction, isPending] = useActionState(registerUser, initialState)
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [pathway, setPathway] = useState("")

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId) ?? null
  const isBeta = selectedOrgId === "beta"
  // For orgs, pathway is derived from accounting_type; only beta testers choose manually
  const showPathwaySelector = isBeta
  // Resolved pathway for display (when org selected) — fall back to the raw
  // accounting_type if it doesn't match one of the known keys.
  const knownAccountingKeys = new Set(["cash-basis", "accrual", "custom"])
  const orgAccountingKey = selectedOrg && knownAccountingKeys.has(selectedOrg.accounting_type)
    ? (selectedOrg.accounting_type as "cash-basis" | "accrual" | "custom")
    : null
  const orgPathwayLabel = orgAccountingKey
    ? t(`accountingLabels.${orgAccountingKey}` as `accountingLabels.${typeof orgAccountingKey}`)
    : selectedOrg?.accounting_type ?? null

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Hidden field carries the active locale so the redirect preserves it */}
      <input type="hidden" name="locale" value={locale} />
      {/* Error banner — message comes from auth/actions.ts and is currently
          English-only. TODO move action error messages to translation keys. */}
      {state.status === "error" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Name + job title on one row on wider screens */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("fullNameLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
            placeholder={t("fullNamePlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="job_title" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("jobTitleLabel")}
          </label>
          <input
            id="job_title"
            name="job_title"
            type="text"
            autoComplete="organization-title"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
            placeholder={t("jobTitlePlaceholder")}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("emailLabel")} <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          placeholder={t("emailPlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("passwordLabel")} <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          placeholder={t("passwordPlaceholder")}
        />
      </div>

      {/* Organisation / registration type */}
      <div>
        <label htmlFor="org_id" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("orgLabel")} <span className="text-red-500">*</span>
        </label>
        <select
          id="org_id"
          name="org_id"
          required
          value={selectedOrgId}
          onChange={(e) => {
            setSelectedOrgId(e.target.value)
            setPathway("") // reset pathway when org changes
          }}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
        >
          <option value="" disabled>{t("orgPlaceholder")}</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}{org.country && org.country !== "Demo" ? `, ${org.country}` : ""}
              {org.demo ? t("orgDemoSuffix") : ""}
            </option>
          ))}
          {/* Beta tester option — shown below a visual separator */}
          <optgroup label={t("orgGroupOther")}>
            <option value="beta">{t("orgBetaTesterOption")}</option>
          </optgroup>
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          {selectedOrg?.demo
            ? t("orgHelpDemo")
            : isBeta
            ? t("orgHelpBeta")
            : t("orgHelpDefault")}
        </p>
      </div>

      {/* Accounting pathway — shown as info label when org selected, selector for beta */}
      {selectedOrg && (
        <div className="rounded-md border border-ppf-sky/20 bg-ppf-pale px-4 py-3 text-sm">
          <p className="font-medium text-ppf-navy">{t("accountingBasisTitle")}</p>
          <p className="mt-0.5 text-slate-600">{orgPathwayLabel}</p>
          <p className="mt-1 text-xs text-slate-400">{t("accountingBasisNote")}</p>
          {/* Hidden field so server action still receives pathway */}
          <input type="hidden" name="pathway" value={
            selectedOrg.accounting_type === "accrual" ? "accrual" : "cash-basis"
          } />
        </div>
      )}

      {showPathwaySelector && (
        <div>
          <label htmlFor="pathway" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("pathwayLabel")} <span className="text-red-500">*</span>
          </label>
          <select
            id="pathway"
            name="pathway"
            required
            value={pathway}
            onChange={(e) => setPathway(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          >
            <option value="">{t("pathwayPlaceholder")}</option>
            <option value="accrual">{t("pathwayAccrual")}</option>
            <option value="cash-basis">{t("pathwayCashBasis")}</option>
          </select>
          <p className="mt-1.5 text-xs text-slate-500">
            {t("pathwayHelp")}
          </p>
        </div>
      )}

      {/* Difficulty — only shown when pathway is accrual (org or beta) */}
      {(selectedOrg?.accounting_type === "accrual" || (isBeta && pathway === "accrual")) && (
        <div>
          <label htmlFor="ability_level" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("levelLabel")} <span className="text-red-500">*</span>
          </label>
          <select
            id="ability_level"
            name="ability_level"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          >
            <option value="">{t("levelPlaceholder")}</option>
            <option value="beginner">{t("levelBeginner")}</option>
            <option value="intermediate">{t("levelIntermediate")}</option>
            <option value="advanced">{t("levelAdvanced")}</option>
          </select>
          <p className="mt-1.5 text-xs text-slate-500">
            {t("levelHelp")}
          </p>
        </div>
      )}

      {/* Product access — which part of the platform the user needs */}
      <div>
        <label htmlFor="product_access" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("productAccessLabel")} <span className="text-red-500">*</span>
        </label>
        <select
          id="product_access"
          name="product_access"
          required
          defaultValue=""
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
        >
          <option value="" disabled>{t("productAccessPlaceholder")}</option>
          <option value="training">{t("productTraining")}</option>
          <option value="advisor">{t("productAdvisor")}</option>
          <option value="both">{t("productBoth")}</option>
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          {t("productHelp")}
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-ppf-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-60"
      >
        {isPending ? t("creating") : t("createButton")}
      </button>
    </form>
  )
}
