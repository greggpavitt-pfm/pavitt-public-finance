// User profile / preferences page.
// Currently the only user-facing setting is the daily flashcard email opt-in.
// Add other user preferences here as they arise.

import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { FlashcardEmailToggle } from "./FlashcardEmailToggle"

export const dynamic = "force-dynamic"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Profile" })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, daily_flashcard_email, daily_flashcard_send_hour_utc, training_approved")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return <main className="p-6">{t("notFound")}</main>
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <section className="rounded-lg border border-gray-200 p-4">
        <div className="text-sm text-gray-500">{t("nameLabel")}</div>
        <div className="font-medium">{profile.full_name ?? t("noNameSet")}</div>
        <div className="text-sm text-gray-500 mt-3">{t("emailLabel")}</div>
        <div className="font-medium">{profile.email}</div>
      </section>

      {profile.training_approved && (
        <section className="rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold">{t("flashcardTitle")}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t("flashcardLead")}
          </p>
          <div className="mt-4">
            <FlashcardEmailToggle
              initialEnabled={profile.daily_flashcard_email}
              initialHour={profile.daily_flashcard_send_hour_utc}
            />
          </div>
        </section>
      )}
    </main>
  )
}
