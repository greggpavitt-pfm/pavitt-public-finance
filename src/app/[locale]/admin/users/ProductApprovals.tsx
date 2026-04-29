"use client"
// Separate Training / Practitioner approval checkboxes for each user row.
// Independent of the overall account_status — both flags can be toggled
// regardless of whether the account is pending or approved.

import { useState, useTransition } from "react"
import { updateUserApprovals } from "@/app/[locale]/admin/actions"

interface Props {
  userId: string
  trainingApproved: boolean
  practitionerApproved: boolean
}

export default function ProductApprovals({ userId, trainingApproved, practitionerApproved }: Props) {
  const [isPending, startTransition] = useTransition()
  const [training, setTraining]         = useState(trainingApproved)
  const [practitioner, setPractitioner] = useState(practitionerApproved)

  function save(newTraining: boolean, newPractitioner: boolean) {
    startTransition(async () => {
      const result = await updateUserApprovals(userId, newTraining, newPractitioner)
      if (result.error) alert(`Error: ${result.error}`)
    })
  }

  function handleTraining(checked: boolean) {
    setTraining(checked)
    save(checked, practitioner)
  }

  function handlePractitioner(checked: boolean) {
    setPractitioner(checked)
    save(training, checked)
  }

  return (
    <div className={`flex flex-col gap-1 text-xs ${isPending ? "opacity-50" : ""}`}>
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={training}
          onChange={(e) => handleTraining(e.target.checked)}
          disabled={isPending}
          className="accent-ppf-sky"
        />
        <span className="text-slate-600">Training</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={practitioner}
          onChange={(e) => handlePractitioner(e.target.checked)}
          disabled={isPending}
          className="accent-ppf-sky"
        />
        <span className="text-slate-600">Practitioner</span>
      </label>
    </div>
  )
}
