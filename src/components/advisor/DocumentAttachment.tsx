// DocumentAttachment — Displays a single PDF attachment in the conversation thread.
// Shown in the conversation header above the message thread when documents are attached.

interface DocumentAttachmentProps {
  document: {
    id: string
    original_filename: string
    file_size_bytes: number
    extracted_char_count: number | null
    status: string  // 'ready' | 'failed' | 'processing'
    signedUrl: string | null
  }
}

// Format bytes as a human-readable string (e.g. "1.2 MB")
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Format character count as an approximate token/reading size hint
function formatCharCount(chars: number): string {
  if (chars < 1000) return `${chars} chars extracted`
  return `~${(chars / 1000).toFixed(1)}k chars extracted`
}

export default function DocumentAttachment({ document }: DocumentAttachmentProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
      {/* PDF icon */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
        className="h-5 w-5 shrink-0 text-red-500">
        <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
      </svg>

      {/* File info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {document.original_filename}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(document.file_size_bytes)}
        </p>
      </div>

      {/* Extraction status badge */}
      {document.status === "ready" && (
        <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          {document.extracted_char_count
            ? formatCharCount(document.extracted_char_count)
            : "Text extracted"}
        </span>
      )}

      {document.status === "failed" && (
        <span
          className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
          title="This PDF appears to be scanned or image-only. The advisor cannot read its contents."
        >
          Extraction failed — image-only PDF
        </span>
      )}

      {document.status === "processing" && (
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          Processing…
        </span>
      )}

      {/* View PDF link — only shown when a signed URL is available */}
      {document.signedUrl && (
        <a
          href={document.signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-ppf-sky hover:underline"
        >
          View PDF
        </a>
      )}
    </div>
  )
}
