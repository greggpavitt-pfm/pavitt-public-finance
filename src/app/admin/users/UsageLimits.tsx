"use client"
// Per-user usage limit inputs for training questions (30-day) and
// practitioner submissions (7-day). Leaving blank resets to the org/subgroup
// default. Saves on blur so the admin can tab across rows quickly.

import { useState, useTransition } from "react"
import { updateUserLimits } from "@/app/admin/actions"

interface Props {
  userId: string
  trainingLimit: number | null
  practitionerLimit: number | null
  // Text shown when null — e.g. "Default (50)" populated from org data by the page
  trainingPlaceholder?: string
  practitionerPlaceholder?: string
}

export default function UsageLimits({
  userId,
  trainingLimit,
  practitionerLimit,
  trainingPlaceholder = "Default",
  practitionerPlaceholder = "Default",
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [training, setTraining]         = useState<string>(trainingLimit?.toString() ?? "")
  const [practitioner, setPractitioner] = useState<string>(practitionerLimit?.toString() ?? "")

  function save(trainingStr: string, practitionerStr: string) {
    const tLimit = trainingStr     === "" ? null : parseInt(trainingStr, 10)
    const pLimit = practitionerStr === "" ? null : parseInt(practitionerStr, 10)
    if (
      (trainingStr     !== "" && isNaN(tLimit!)) ||
      (practitionerStr !== "" && isNaN(pLimit!))
    ) return  // ignore non-numeric input

    startTransition(async () => {
      const result = await updateUserLimits(userId, tLimit, pLimit)
      if (result.error) alert(`Error: ${result.error}`)
    })
  }

  return (
    <div className={`flex flex-col gap-1 ${isPending ? "opacity-50" : ""}`}>
      <label className="flex items-center gap-1 text-xs text-slate-500">
        <span className="w-16 shrink-0">Questions</span>
        <input
          type="number"
          min={0}
          value={training}
          placeholder={trainingPlaceholder}
          onChange={(e) => setTraining(e.target.value)}
          onBlur={() => save(training, practitioner)}
          disabled={isPending}
          className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-700 focus:border-ppf-sky focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-slate-500">
        <span className="w-16 shrink-0">Submissions</span>
        <input
          type="number"
          min={0}
          value={practitioner}
          placeholder={practitionerPlaceholder}
          onChange={(e) => setPractitioner(e.target.value)}
          onBlur={() => save(training, practitioner)}
          disabled={isPending}
          className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-700 focus:border-ppf-sky focus:outline-none"
        />
      </label>
    </div>
  )
}
