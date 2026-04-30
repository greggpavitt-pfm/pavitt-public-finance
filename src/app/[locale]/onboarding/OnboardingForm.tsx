"use client"
// Client component for the onboarding form.
// Pre-fills pathway and difficulty with values already on the user's profile.

import { useActionState, useState } from "react"
import { useTranslations } from "next-intl"
import { completeOnboarding, type AuthFormState } from "@/app/auth/actions"

interface Props {
  currentPathway: string
  currentAbility: string
}

const initialState: AuthFormState = { status: "idle", message: "" }

export default function OnboardingForm({ currentPathway, currentAbility }: Props) {
  const t = useTranslations("Onboarding")
  const [state, formAction, isPending] = useActionState(completeOnboarding, initialState)
  const [pathway, setPathway] = useState(currentPathway)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.status === "error" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="pathway" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("pathwayLabel")}
        </label>
        <select
          id="pathway"
          name="pathway"
          required
          value={pathway}
          onChange={(e) => setPathway(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
        >
          <option value="">{t("pathwayPlaceholder")}</option>
          <option value="accrual">{t("pathwayAccrual")}</option>
          <option value="cash-basis">{t("pathwayCashBasis")}</option>
        </select>
      </div>

      {pathway === "accrual" && (
        <div>
          <label htmlFor="ability_level" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("levelLabel")}
          </label>
          <select
            id="ability_level"
            name="ability_level"
            required
            defaultValue={currentAbility}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          >
            <option value="">{t("levelPlaceholder")}</option>
            <option value="beginner">{t("levelBeginner")}</option>
            <option value="intermediate">{t("levelIntermediate")}</option>
            <option value="advanced">{t("levelAdvanced")}</option>
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-ppf-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-60"
      >
        {isPending ? t("saving") : t("saveButton")}
      </button>
    </form>
  )
}
