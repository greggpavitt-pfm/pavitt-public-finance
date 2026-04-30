"use client"

// Client component for the daily flashcard email opt-in.
// Uses a Server Action (in actions.ts) to save the change.

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { saveFlashcardEmailPrefs } from "./actions"

export function FlashcardEmailToggle(props: {
  initialEnabled: boolean
  initialHour: number | null
}) {
  const t = useTranslations("Profile")
  const [enabled, setEnabled] = useState(props.initialEnabled)
  const [hour, setHour] = useState<number | null>(props.initialHour)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await saveFlashcardEmailPrefs({ enabled, hour })
      // Server-action error strings remain English for now; the localized
      // prefix tags them so the UI line still reads consistently.
      setMessage(result.ok ? t("savedMessage") : `${t("errorPrefix")}${result.error}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        <span>{t("flashcardCheckbox")}</span>
      </label>

      {enabled && (
        <label className="block text-sm">
          <span className="text-gray-700">{t("flashcardHourLabel")}</span>
          <select
            value={hour ?? ""}
            onChange={(e) =>
              setHour(e.target.value === "" ? null : Number(e.target.value))
            }
            className="ml-2 border border-gray-300 rounded px-2 py-1"
          >
            <option value="">{t("flashcardHourDefault")}</option>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? t("saving") : t("saveButton")}
      </button>

      {message && <p className="text-sm text-gray-700">{message}</p>}
    </form>
  )
}
