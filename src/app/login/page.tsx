// /login — email + password sign-in page.
// Uses a Client Component for the form so we can use useActionState for inline error display.
// On success, the server action redirects to /training (middleware handles
// further routing based on account_status and onboarding_complete).

import type { Metadata } from "next"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import LoginForm from "./LoginForm"

export const metadata: Metadata = {
  title: "Log In — IPSAS Training",
  description: "Sign in to your IPSAS Training account.",
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-ppf-sky/20 bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-2xl font-bold text-ppf-navy">Sign in</h1>
            <p className="mb-8 text-sm text-slate-500">
              Access your IPSAS training account.
            </p>
            <LoginForm />
            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <a href="/register" className="font-medium text-ppf-sky hover:underline">
                Register here
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
