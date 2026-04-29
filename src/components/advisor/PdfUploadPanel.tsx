"use client"
// PdfUploadPanel — Replaces StartConversationButton on the advisor dashboard.
//
// Lets the user optionally attach a PDF before starting a conversation.
// Flow:
//   1. User selects (or drags) a PDF — validated client-side immediately
//   2. User clicks "Start Conversation"
//   3. Server action creates the conversation → gets conversationId
//   4. If a PDF was selected, it is uploaded to /api/advisor/upload
//   5. Browser navigates to /advisor/{conversationId}

import { useState, useRef, DragEvent, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { createConversation } from "@/app/[locale]/advisor/actions"

const MAX_SIZE_BYTES = 4 * 1024 * 1024 // 4 MB

// Format bytes as a human-readable string (e.g. "1.2 MB")
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type Stage = "idle" | "creating" | "uploading" | "done"

export default function PdfUploadPanel() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [stage, setStage] = useState<Stage>("idle")
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Validate a file before accepting it
  function validateFile(file: File): string | null {
    if (file.type !== "application/pdf") return "Only PDF files are supported."
    if (file.size > MAX_SIZE_BYTES) return "File too large — maximum 4 MB."
    return null
  }

  function handleFileSelect(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      return
    }
    setError(null)
    setSelectedFile(file)
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleRemoveFile() {
    setSelectedFile(null)
    setError(null)
    // Reset the file input so the same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleStart() {
    setError(null)
    setStage("creating")

    // Step 1 — create the conversation
    const { conversationId, error: createError } = await createConversation(
      "New Conversation",
      "quick_treatment"
    )

    if (createError || !conversationId) {
      setError(createError ?? "Failed to create conversation.")
      setStage("idle")
      return
    }

    // Step 2 — upload the PDF if one was selected
    if (selectedFile) {
      setStage("uploading")

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("conversationId", conversationId)

      try {
        // Do not set Content-Type manually — the browser sets the multipart boundary automatically
        const response = await fetch("/api/advisor/upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          // Upload failed — show a warning but still navigate to the conversation.
          // The user can ask questions without the document; they will just not have PDF context.
          console.warn("PDF upload failed:", result.error)
          setError(`PDF upload failed: ${result.error ?? "Unknown error"}. You can still continue without it.`)
        } else if (result.status === "failed") {
          // Extraction failed (e.g. scanned PDF) — navigation proceeds, extraction badge shown in thread
          console.warn("PDF text extraction failed for:", selectedFile.name)
        }
      } catch (uploadErr) {
        console.warn("PDF upload network error:", uploadErr)
        setError("PDF upload failed due to a network error. You can still continue without it.")
      }
    }

    setStage("done")
    router.push(`/advisor/${conversationId}`)
  }

  const isWorking = stage === "creating" || stage === "uploading"

  const buttonLabel =
    stage === "creating" ? "Creating conversation..." :
    stage === "uploading" ? "Uploading PDF..." :
    "Start Conversation"

  return (
    <div className="rounded-xl border border-ppf-sky/30 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Start New Conversation</h2>
      <p className="mt-1 text-sm text-gray-600">
        Ask about an IPSAS accounting treatment. Optionally attach a PDF document (budget
        report, contract, financial statement) for the advisor to analyse alongside your question.
      </p>

      <div className="mt-4">
        {/* File selected state — show file info */}
        {selectedFile ? (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            {/* PDF icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
              className="h-6 w-6 shrink-0 text-red-500">
              <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
              <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={handleRemoveFile}
              disabled={isWorking}
              className="shrink-0 text-sm text-gray-400 hover:text-red-500 disabled:opacity-40"
              aria-label="Remove file"
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          /* Drop zone — shown when no file is selected */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8
              transition-colors
              ${isDragOver
                ? "border-ppf-sky bg-ppf-pale"
                : "border-gray-300 bg-gray-50 hover:border-ppf-sky hover:bg-ppf-pale"
              }
            `}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
            aria-label="Upload PDF document"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
              stroke="currentColor" className="h-8 w-8 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Drag a PDF here, or <span className="text-ppf-sky">click to browse</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">Optional · PDF only · Max 4 MB</p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Validation / upload error message */}
      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={isWorking}
        className="
          mt-5 w-full rounded-lg bg-ppf-sky px-6 py-3 text-sm font-semibold text-white
          shadow-sm transition-colors hover:bg-ppf-navy
          disabled:cursor-not-allowed disabled:opacity-60
        "
      >
        {buttonLabel}
      </button>
    </div>
  )
}
