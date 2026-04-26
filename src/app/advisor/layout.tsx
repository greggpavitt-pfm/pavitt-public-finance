// /advisor layout — main layout for the Practitioner Advisor routes
// Includes: AuthNavbar + Sidebar (conversations + output mode) + main content area

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AuthNavbar from "@/components/ui/AuthNavbar"
import AdvisorSidebar from "@/components/advisor/AdvisorSidebar"

export default async function AdvisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch user's name for the navbar
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top Navigation — hidden on print so the saved PDF starts with the
          conversation header, not the app chrome. */}
      <div className="no-print">
        <AuthNavbar userName={profile?.full_name || "User"} currentPath="/advisor" />
      </div>

      {/* Main Content Area — Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — Conversation List + Output Mode Selector */}
        <div className="no-print">
          <AdvisorSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}
