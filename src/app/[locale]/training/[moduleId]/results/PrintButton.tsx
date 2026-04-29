"use client"
// PrintButton — triggers the browser's print dialog.
// Must be a client component because window.print() is browser-only.

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-ppf-sky px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue"
    >
      Print / Save as PDF
    </button>
  )
}
