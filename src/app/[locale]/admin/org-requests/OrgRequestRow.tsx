"use client"
// Single row in the org-requests admin list. Pending rows show
// Approve/Reject buttons + a notes input. Reviewed rows show status + when.

import { useState, useTransition } from "react"
import { approveOrgRequest, rejectOrgRequest } from "./actions"

interface OrgRequest {
  id: string
  created_at: string
  org_name: string
  country: string
  contact_name: string
  contact_email: string
  role: string | null
  expected_users: number | null
  accounting_type: string | null
  status: string
  org_id: string | null
  notes: string | null
  reviewed_at: string | null
}

interface Props {
  request: OrgRequest
  readOnly?: boolean
}

export default function OrgRequestRow({ request, readOnly = false }: Props) {
  const [pending, startTransition] = useTransition()
  const [notes, setNotes] = useState<string>(request.notes ?? "")
  const [error, setError] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const r = await approveOrgRequest(request.id, notes || null)
      if (r.error) setError(r.error)
    })
  }

  function handleReject() {
    setError(null)
    startTransition(async () => {
      const r = await rejectOrgRequest(request.id, notes || null)
      if (r.error) setError(r.error)
    })
  }

  const submittedAt = new Date(request.created_at).toLocaleString()
  const reviewedAt = request.reviewed_at
    ? new Date(request.reviewed_at).toLocaleString()
    : null

  return (
    <div className="rounded-lg border border-ppf-sky/20 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ppf-navy">{request.org_name}</p>
          <p className="text-sm text-slate-600">
            {request.country}
            {request.accounting_type && (
              <>
                {" · "}
                <span className="text-slate-500">{request.accounting_type}</span>
              </>
            )}
            {request.expected_users !== null && (
              <>
                {" · "}
                <span className="text-slate-500">{request.expected_users} expected users</span>
              </>
            )}
          </p>
          <p className="mt-1 text-sm">
            <span className="text-slate-700">{request.contact_name}</span>
            {request.role && <span className="text-slate-500"> ({request.role})</span>}
            {" · "}
            <a
              href={`mailto:${request.contact_email}`}
              className="text-ppf-sky hover:underline"
            >
              {request.contact_email}
            </a>
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Submitted {submittedAt}
            {reviewedAt && ` · Reviewed ${reviewedAt}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {request.status === "pending" ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Pending
            </span>
          ) : request.status === "approved" ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              Approved
            </span>
          ) : (
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              Rejected
            </span>
          )}
        </div>
      </div>

      {!readOnly && request.status === "pending" && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Notes (optional, internal)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. confirmed via phone, expected to convert in Q2"
            className="mb-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-ppf-sky focus:outline-none"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={pending}
              className="rounded-md bg-ppf-sky px-4 py-2 text-sm font-semibold text-white hover:bg-ppf-sky-hover disabled:opacity-60"
            >
              {pending ? "Working…" : "Approve & start trial"}
            </button>

            {showRejectForm ? (
              <>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={pending}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Confirm reject
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  disabled={pending}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                disabled={pending}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Reject
              </button>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        </div>
      )}

      {request.notes && readOnly && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notes:
          </span>{" "}
          {request.notes}
        </p>
      )}
    </div>
  )
}
