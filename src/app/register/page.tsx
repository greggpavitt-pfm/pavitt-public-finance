// /register — new user sign-up page.
// Collects name, email, password, job title, licence key (to identify their org),
// pathway (accrual or cash-basis), and difficulty level (accrual only).
// On success the server action creates the auth user + profile row and redirects to /pending.

import type { Metadata } from "next"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import RegisterForm from "./RegisterForm"

export const metadata: Metadata = {
  title: "Register — IPSAS Training",
  description: "Create your IPSAS Training account.",
}

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="rounded-lg border border-ppf-sky/20 bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-2xl font-bold text-ppf-navy">Create an account</h1>
            <p className="mb-8 text-sm text-slate-500">
              Your account will be reviewed by your organisation administrator before you can access training materials.
            </p>
            <RegisterForm />
            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <a href="/login" className="font-medium text-ppf-sky hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
