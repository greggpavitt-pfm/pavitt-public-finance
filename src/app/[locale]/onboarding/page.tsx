// /onboarding — shown after admin approval if onboarding_complete is false.
// Lets the user confirm (or change) their pathway and difficulty level
// before they access the training modules.
// On submit, sets onboarding_complete = true in their profile and redirects to /training.

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { createClient } from "@/lib/supabase/server"
import OnboardingForm from "./OnboardingForm"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Onboarding" })
  return {
    title: t("metaTitle"),
  }
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Onboarding" })

  // Load the user's current profile so we can pre-fill their selections
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("pathway, ability_level, account_status, onboarding_complete, product_access")
    .eq("id", user.id)
    .single()

  // If not yet approved, send them to the pending page
  if (!profile || profile.account_status !== "approved") {
    redirect("/pending")
  }

  // Advisor-only users don't need training onboarding — their context is set
  // inside the advisor via ContextPanel. Mark them complete and send them there.
  if (profile.product_access === "advisor") {
    redirect("/advisor")
  }

  // If they've already finished onboarding, send them straight to training
  if (profile.onboarding_complete) {
    redirect("/training")
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-ppf-sky/20 bg-white p-8 shadow-sm">
            {/* Tick icon to signal approval */}
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-7 w-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h1 className="mb-2 text-center text-2xl font-bold text-ppf-navy">{t("approvedTitle")}</h1>
            <p className="mb-8 text-center text-sm text-slate-500">
              {t("approvedSubtitle")}
            </p>

            {/* Pass current values so the form can pre-select them */}
            <OnboardingForm
              currentPathway={profile.pathway ?? ""}
              currentAbility={profile.ability_level ?? ""}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
