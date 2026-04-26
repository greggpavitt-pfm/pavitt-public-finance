"use client"
// Per-user usage limit inputs:
//  - Questions   — training MCQ answers (30-day rolling)
//  - Submissions — practitioner advisor submissions (7-day rolling)
//  - Tokens/day  — practitioner advisor token cap (per UTC day)
// Leaving a field blank inherits the org/subgroup default.

import { useState, useTransition } from "react"
import { updateUserLimits } from "@/app/admin/actions"

interface Props {
  userId: string
  trainingLimit: number | null
  practitionerLimit: number | null
  dailyTokenLimit: number | null
  // Text shown when the field is null — e.g. "Default (50)" populated by the page
  trainingPlaceholder?: string
  practitionerPlaceholder?: string
  dailyTokenPlaceholder?: string
}

export default function UsageLimits({
  userId,
  trainingLimit,
  practitionerLimit,
  dailyTokenLimit,
  trainingPlaceholder = "Default",
  practitionerPlaceholder = "Default",
  dailyTokenPlaceholder = "Default",
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [training, setTraining]         = useState<string>(trainingLimit?.toString() ?? "")
  const [practitioner, setPractitioner] = useState<string>(practitionerLimit?.toString() ?? "")
  const [tokens, setTokens]             = useState<string>(dailyTokenLimit?.toString() ?? "")

  function save(trainingStr: string, practitionerStr: string, tokenStr: string) {
    const tLimit = trainingStr     === "" ? null : parseInt(trainingStr, 10)
    const pLimit = practitionerStr === "" ? null : parseInt(practitionerStr, 10)
    const dLimit = tokenStr        === "" ? null : parseInt(tokenStr, 10)
    if (
      (trainingStr     !== "" && isNaN(tLimit!)) ||
      (practitionerStr !== "" && isNaN(pLimit!)) ||
      (tokenStr        !== "" && isNaN(dLimit!))
    ) return  // ignore non-numeric input

    startTransition(async () => {
      const result = await updateUserLimits(userId, tLimit, pLimit, dLimit)
      if (result.error) alert(`Error: ${result.error}`)
    })
  }

  return (
    <div className={`flex flex-col gap-1 ${isPending ? "opacity-50" : ""}`}>
      <label className="flex items-center gap-1 text-xs text-slate-500">
        <span className="w-20 shrink-0">Questions</span>
        <input
          type="number"
          min={0}
          value={training}
          placeholder={trainingPlaceholder}
          onChange={(e) => setTraining(e.target.value)}
          onBlur={() => save(training, practitioner, tokens)}
          disabled={isPending}
          className="w-20 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-700 focus:border-ppf-sky focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-slate-500">
        <span className="w-20 shrink-0">Submissions</span>
        <input
          type="number"
          min={0}
          value={practitioner}
          placeholder={practitionerPlaceholder}
          onChange={(e) => setPractitioner(e.target.value)}
          onBlur={() => save(training, practitioner, tokens)}
          disabled={isPending}
          className="w-20 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-700 focus:border-ppf-sky focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-slate-500">
        <span className="w-20 shrink-0">Tokens/day</span>
        <input
          type="number"
          min={0}
          max={1000000}
          step={1000}
          value={tokens}
          placeholder={dailyTokenPlaceholder}
          onChange={(e) => setTokens(e.target.value)}
          onBlur={() => save(training, practitioner, tokens)}
          disabled={isPending}
          className="w-20 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-700 focus:border-ppf-sky focus:outline-none"
        />
      </label>
    </div>
  )
}
