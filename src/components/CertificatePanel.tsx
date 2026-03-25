"use client"
// CertificatePanel — collapsible left-side panel showing the user's completed
// module results with a "Print Certificate" option.
//
// Visible by default on desktop, collapsed/expandable on mobile.
// Data is passed in as a prop (fetched server-side on the training page).

import { useState } from "react"

export interface ResultSummary {
  module_id: string
  module_title: string
  score: number
  passed: boolean
  submitted_at: string
  attempt_number: number
}

interface Props {
  results: ResultSummary[]
  studentName: string
  orgName: string | null
}

export default function CertificatePanel({ results, studentName, orgName }: Props) {
  // On mobile the panel starts collapsed; on desktop it starts open.
  // We use a simple toggle — no CSS-only solution so we can manage print state.
  const [open, setOpen] = useState(false)
  const [printing, setPrinting] = useState(false)

  const passedCount = results.filter((r) => r.passed).length

  function handlePrint() {
    // Temporarily show the full panel content in a print-specific window
    setPrinting(true)

    const passedModules = results.filter((r) => r.passed)

    const rows = passedModules
      .map(
        (r) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${r.module_title}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${r.score}%</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${new Date(r.submitted_at).toLocaleDateString("en-GB")}</td>
          </tr>`
      )
      .join("")

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Training Certificate — ${studentName}</title>
  <style>
    body { font-family: Georgia, serif; padding: 60px; color: #1e293b; }
    h1 { font-size: 28px; margin-bottom: 4px; color: #0f3460; }
    .subtitle { font-size: 15px; color: #64748b; margin-bottom: 40px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-size: 13px; color: #475569; }
    td { font-size: 13px; color: #334155; }
    .footer { margin-top: 60px; font-size: 11px; color: #94a3b8; text-align: center; }
    .badge { display:inline-block; background:#d1fae5; color:#065f46; padding:2px 10px; border-radius:99px; font-size:12px; font-weight:bold; }
  </style>
</head>
<body>
  <h1>Training Achievement Record</h1>
  <div class="subtitle">
    ${studentName}${orgName ? ` &mdash; ${orgName}` : ""}
  </div>
  <p>
    This record certifies that the above participant has completed the following
    IPSAS training modules with a passing score of 70% or above.
  </p>
  <table>
    <thead>
      <tr>
        <th>Module</th>
        <th style="text-align:center;">Score</th>
        <th style="text-align:center;">Date completed</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top:24px;">
    Modules passed: <strong>${passedModules.length}</strong>
  </p>
  <div class="footer">
    IPSAS Training Platform &mdash; pfmexpert.net &mdash; Printed ${new Date().toLocaleDateString("en-GB")}
  </div>
</body>
</html>`

    const win = window.open("", "_blank")
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => {
        win.print()
        win.close()
      }, 400)
    }

    setPrinting(false)
  }

  return (
    <div className="mb-8 rounded-lg border border-ppf-sky/20 bg-white shadow-sm">
      {/* Panel header — always visible, acts as the toggle on mobile */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          {/* Trophy icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-ppf-sky shrink-0">
            <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-ppf-navy">My Results</p>
            <p className="text-xs text-slate-400">
              {passedCount} passed &middot; {results.length} completed
            </p>
          </div>
        </div>
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Panel body — shown when open */}
      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4">
          {results.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No completed modules yet. Finish your first module to see your results here.
            </p>
          ) : (
            <>
              {/* Results list */}
              <div className="mb-4 divide-y divide-slate-100">
                {results.map((r) => (
                  <div key={r.module_id} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Pass/fail dot */}
                      <span className={`h-2 w-2 rounded-full shrink-0 ${r.passed ? "bg-green-500" : "bg-amber-400"}`} />
                      <span className="text-sm text-slate-700 truncate">{r.module_title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-semibold ${r.passed ? "text-green-600" : "text-amber-600"}`}>
                        {r.score}%
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Print certificate button — only if at least one pass */}
              {passedCount > 0 && (
                <button
                  onClick={handlePrint}
                  disabled={printing}
                  className="w-full rounded-md bg-ppf-sky px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-60"
                >
                  {printing ? "Preparing…" : "Print Achievement Certificate"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
