"use client"
// ExportButton — downloads the results table as a CSV file.
// Must be a client component because it uses browser APIs (Blob, URL.createObjectURL).

import type { ResultRow } from "@/app/admin/actions"

interface Props {
  rows: ResultRow[]
  filename: string
  includeOrg?: boolean
}

export default function ExportButton({ rows, filename, includeOrg = false }: Props) {
  function handleExport() {
    // Build CSV header
    const headers = [
      "Student name",
      ...(includeOrg ? ["Organisation"] : []),
      "Module",
      "Score (%)",
      "Pass/fail",
      "Date submitted",
      "Attempt",
    ]

    // Build CSV rows
    const csvRows = rows.map((r) => [
      `"${r.full_name.replace(/"/g, '""')}"`,
      ...(includeOrg ? [`"${(r.org_name ?? "").replace(/"/g, '""')}"`] : []),
      `"${r.module_title.replace(/"/g, '""')}"`,
      r.score,
      r.passed ? "Pass" : "Fail",
      `"${new Date(r.submitted_at).toLocaleDateString("en-GB")}"`,
      r.attempt_number,
    ])

    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
    >
      Export CSV
    </button>
  )
}
