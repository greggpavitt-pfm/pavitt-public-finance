// /pending — shown to users who have registered but whose account
// has not yet been approved by an administrator.
// The middleware redirects unapproved users here if they try to access /training.

import type { Metadata } from "next"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { logoutUser } from "@/app/auth/actions"

export const metadata: Metadata = {
  title: "Awaiting Approval — IPSAS Training",
}

export default function PendingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 shadow-sm">
            {/* Clock icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ppf-pale text-ppf-sky">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>

            <h1 className="mb-3 text-2xl font-bold text-ppf-navy">Account pending approval</h1>
            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              Your registration has been received and is waiting for review.
              You will be contacted by email once your account is approved.
            </p>
            <p className="mb-8 text-sm text-slate-500">
              If you haven&apos;t heard back within a few business days, please get in touch
              at <a href="mailto:gregg.pavitt@pfmexpert.net" className="text-ppf-sky hover:underline">gregg.pavitt@pfmexpert.net</a>.
            </p>

            {/* Sign out — uses a form so it triggers the server action */}
            <form action={logoutUser}>
              <button
                type="submit"
                className="text-sm font-medium text-ppf-sky hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
