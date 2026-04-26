"use client"
// CSV invite form — picks org + optional subgroup, pastes CSV, submits to
// inviteByCsv server action. Shows summary of created/skipped/errors after
// submit. Operator stays on the page to invite multiple batches.

import { useState, useTransition } from "react"
import { inviteByCsv, type InviteResult } from "./actions"

interface Org { id: string; name: string }
interface Subgroup { id: string; org_id: string; name: string }

interface Props {
  orgs: Org[]
  subgroups: Subgroup[]
}

export default function InviteForm({ orgs, subgroups }: Props) {
  const [orgId, setOrgId] = useState<string>(orgs[0]?.id ?? "")
  const [subgroupId, setSubgroupId] = useState<string>("")
  const [csv, setCsv] = useState<string>("")
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<InviteResult | null>(null)

  const orgSubgroups = subgroups.filter((s) => s.org_id === orgId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !csv.trim()) return
    startTransition(async () => {
      const r = await inviteByCsv(csv, orgId, subgroupId || null)
      setResult(r)
      if (r.created > 0) setCsv("")  // clear textarea on partial success
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-ppf-sky/20 bg-white p-6 shadow-sm"
    >
      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Organisation
        </label>
        <select
          value={orgId}
          onChange={(e) => { setOrgId(e.target.value); setSubgroupId("") }}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-ppf-sky focus:outline-none"
          required
        >
          {orgs.length === 0 && <option value="">No orgs available</option>}
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      {orgSubgroups.length > 0 && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Subgroup (optional)
          </label>
          <select
            value={subgroupId}
            onChange={(e) => setSubgroupId(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-ppf-sky focus:outline-none"
          >
            <option value="">— None —</option>
            {orgSubgroups.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          CSV
        </label>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={10}
          placeholder="email,full_name,job_title&#10;alice@mof.gov.sb,Alice Tovua,Senior Accountant"
          className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-xs focus:border-ppf-sky focus:outline-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={pending || !orgId || !csv.trim()}
        className="rounded-md bg-ppf-sky px-4 py-2 text-sm font-semibold text-white hover:bg-ppf-sky-hover disabled:opacity-60"
      >
        {pending ? "Sending invites…" : "Send invites"}
      </button>

      {result && (
        <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="mb-2">
            <strong className="text-green-700">{result.created} created</strong>
            {", "}
            <span className="text-slate-600">{result.skipped} skipped (already registered)</span>
            {", "}
            <span className={result.errors.length > 0 ? "text-red-700" : "text-slate-600"}>
              {result.errors.length} errors
            </span>
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-red-700">
              {result.errors.slice(0, 20).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {result.errors.length > 20 && (
                <li className="italic">… and {result.errors.length - 20} more</li>
              )}
            </ul>
          )}
        </div>
      )}
    </form>
  )
}
