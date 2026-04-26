"use client"
// Print / Save-as-PDF button for an advisor conversation.
//
// Calls the browser's native print dialog. The actual visual cleanup is
// done by @media print rules in globals.css plus `no-print` class hooks
// on UI chrome (sidebar, navbar, input bar, feedback buttons, action
// buttons). The user picks "Save as PDF" in the print dialog to get a
// PDF — we don't ship a PDF library to keep the bundle small and avoid
// rendering drift between screen and print.

export default function PrintButton() {
  function handlePrint() {
    if (typeof window === "undefined") return
    window.print()
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="
        no-print inline-flex items-center gap-2 rounded-md
        border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700
        shadow-sm transition-colors hover:bg-gray-50 hover:text-ppf-navy
      "
      aria-label="Print or save as PDF"
      title="Print / Save as PDF"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
        />
      </svg>
      Print / Save as PDF
    </button>
  )
}
