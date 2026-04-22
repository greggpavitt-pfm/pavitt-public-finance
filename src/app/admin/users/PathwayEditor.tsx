"use client"

import { useState, useTransition } from "react"
import { updateUserPathway } from "@/app/admin/actions"

interface Props {
  userId: string
  currentPathway: string | null
  currentAbility: string | null
}

const PATHWAY_LABELS: Record<string, string> = {
  accrual:    "Accrual",
  "cash-basis": "Cash basis",
}

const ABILITY_LABELS: Record<string, string> = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
}

export default function PathwayEditor({ userId, currentPathway, currentAbility }: Props) {
  const [editing, setEditing] = useState(false)
  const [pathway, setPathway] = useState(currentPathway ?? "")
  const [ability, setAbility] = useState(currentAbility ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!pathway) return
    if (pathway === "accrual" && !ability) return

    startTransition(async () => {
      const result = await updateUserPathway(
        userId,
        pathway,
        pathway === "accrual" ? ability : null
      )
      if (result.error) {
        setError(result.error)
      } else {
        setError(null)
        setEditing(false)
      }
    })
  }

  function handleCancel() {
    setPathway(currentPathway ?? "")
    setAbility(currentAbility ?? "")
    setError(null)
    setEditing(false)
  }

  if (!editing) {
    // Display mode — show current value with an edit button
    const pathwayText = currentPathway ? PATHWAY_LABELS[currentPathway] ?? currentPathway : "—"
    const abilityText = currentPathway === "accrual" && currentAbility
      ? ` / ${ABILITY_LABELS[currentAbility] ?? currentAbility}`
      : ""

    return (
      <button
        onClick={() => setEditing(true)}
        title="Edit pathway"
        className="group flex items-center gap-1 text-left text-slate-600 hover:text-ppf-sky"
      >
        <span>{pathwayText}{abilityText}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3 w-3 shrink-0 text-slate-300 group-hover:text-ppf-sky"
        >
          <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.262-4.263a1.75 1.75 0 0 0 0-2.474ZM4.75 13.25a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" />
        </svg>
      </button>
    )
  }

  // Edit mode
  return (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <select
        value={pathway}
        onChange={(e) => {
          setPathway(e.target.value)
          setAbility("")
        }}
        disabled={isPending}
        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:border-ppf-sky focus:outline-none"
      >
        <option value="">— Pathway —</option>
        <option value="accrual">Accrual (IPSAS 1–48)</option>
        <option value="cash-basis">Cash basis (C4)</option>
      </select>

      {pathway === "accrual" && (
        <select
          value={ability}
          onChange={(e) => setAbility(e.target.value)}
          disabled={isPending}
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:border-ppf-sky focus:outline-none"
        >
          <option value="">— Level —</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      )}

      <div className="flex gap-1.5">
        <button
          onClick={handleSave}
          disabled={isPending || !pathway || (pathway === "accrual" && !ability)}
          className="rounded bg-ppf-sky px-2.5 py-1 text-xs font-semibold text-white hover:bg-ppf-blue disabled:opacity-50"
        >
          {isPending ? "…" : "Save"}
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
