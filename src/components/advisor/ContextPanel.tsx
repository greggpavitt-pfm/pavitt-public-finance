"use client"
// Context panel — allows users to set jurisdiction, entity type, reporting basis, currency

import { useState } from "react"
import { saveContext } from "@/app/[locale]/advisor/actions"

interface ContextPanelProps {
  initialContext?: {
    jurisdiction?: string
    entity_type?: string
    reporting_basis?: string
    functional_currency?: string
    reporting_period?: string | null
  }
}

const jurisdictions = [
  "Solomon Islands",
  "Papua New Guinea",
  "Fiji",
  "Generic IPSAS",
]

const entityTypes = [
  "Central Government",
  "Local Government",
  "State-Owned Enterprise",
  "Statutory Authority",
]

const reportingBases = [
  "Accrual IPSAS",
  "Cash Basis IPSAS",
  "Transitioning to Accrual",
]

const currencies = [
  "SBD",
  "PGK",
  "FJD",
  "USD",
  "AUD",
  "Other",
]

export default function ContextPanel({ initialContext }: ContextPanelProps) {
  const [jurisdiction, setJurisdiction] = useState(initialContext?.jurisdiction || "Generic IPSAS")
  const [entityType, setEntityType] = useState(initialContext?.entity_type || "Central Government")
  const [reportingBasis, setReportingBasis] = useState(initialContext?.reporting_basis || "Accrual IPSAS")
  const [currency, setCurrency] = useState(initialContext?.functional_currency || "USD")
  const [reportingPeriod, setReportingPeriod] = useState(initialContext?.reporting_period || "")
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const result = await saveContext(
      jurisdiction,
      entityType,
      reportingBasis,
      currency,
      reportingPeriod
    )
    setSaving(false)

    if (!result.error) {
      setSavedMessage(true)
      setTimeout(() => setSavedMessage(false), 2000)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Set Your Context</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Jurisdiction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jurisdiction
          </label>
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-ppf-blue focus:ring-1 focus:ring-ppf-blue"
          >
            {jurisdictions.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entity Type
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-ppf-blue focus:ring-1 focus:ring-ppf-blue"
          >
            {entityTypes.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        {/* Reporting Basis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reporting Basis
          </label>
          <select
            value={reportingBasis}
            onChange={(e) => setReportingBasis(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-ppf-blue focus:ring-1 focus:ring-ppf-blue"
          >
            {reportingBases.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Functional Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-ppf-blue focus:ring-1 focus:ring-ppf-blue"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Reporting Period */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reporting Period (optional)
          </label>
          <input
            type="text"
            value={reportingPeriod}
            onChange={(e) => setReportingPeriod(e.target.value)}
            placeholder="e.g., Year ending 31 Dec 2025"
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-ppf-blue focus:ring-1 focus:ring-ppf-blue"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-ppf-blue px-6 py-2 font-semibold text-white hover:bg-ppf-sky disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Context"}
        </button>
        {savedMessage && (
          <span className="text-sm text-green-600">✓ Context saved</span>
        )}
      </div>
    </div>
  )
}
