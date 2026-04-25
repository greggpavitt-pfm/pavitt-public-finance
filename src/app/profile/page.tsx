// User profile / preferences page.
// Currently the only user-facing setting is the daily flashcard email opt-in.
// Add other user preferences here as they arise.

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FlashcardEmailToggle } from "./FlashcardEmailToggle"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, daily_flashcard_email, daily_flashcard_send_hour_utc, training_approved")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return <main className="p-6">Profile not found.</main>
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your profile</h1>

      <section className="rounded-lg border border-gray-200 p-4">
        <div className="text-sm text-gray-500">Name</div>
        <div className="font-medium">{profile.full_name ?? "(no name set)"}</div>
        <div className="text-sm text-gray-500 mt-3">Email</div>
        <div className="font-medium">{profile.email}</div>
      </section>

      {profile.training_approved && (
        <section className="rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold">Daily flashcards by email</h2>
          <p className="text-sm text-gray-600 mt-1">
            Get three IPSAS flashcards delivered each day. Spaced repetition picks
            cards that are due for review based on how you graded them last time.
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
