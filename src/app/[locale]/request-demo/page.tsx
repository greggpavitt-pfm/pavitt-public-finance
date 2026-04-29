// Public demo-request landing page.
// Routes off the marketing nav as a "Request demo" CTA. Anonymous-accessible —
// no auth required. Submission goes to org_requests via the action; admin
// reviews on /admin/org-requests.

import type { Metadata } from "next"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import DemoRequestForm from "./DemoRequestForm"

export const metadata: Metadata = {
  title: "Request a demo — Pavitt Public Finance",
  description:
    "Try the Pavitt Public Finance IPSAS training and practitioner advisor platform free for 14 days. Set up your trial in one business day.",
}

export default function RequestDemoPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-3 text-3xl font-bold text-ppf-navy md:text-4xl">
            Request a 14-day trial
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-slate-700">
            Free trial of the IPSAS training modules and the practitioner advisor for
            your team. We&apos;ll set up your organisation, send sign-in details to you,
            and you can invite colleagues from inside the admin panel.
          </p>

          <div className="mb-8 rounded-md border border-ppf-sky/20 bg-white p-5 text-sm text-slate-700">
            <p className="mb-2 font-semibold text-ppf-navy">What you get</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Full access to all training pathways (Cash-basis IPSAS, Accrual IPSAS, custom jurisdictions)</li>
              <li>Practitioner advisor — natural-language IPSAS Q&amp;A with citation verification</li>
              <li>Up to 50 user seats during the trial</li>
              <li>Admin panel — approve users, assign subgroups, monitor usage</li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              No credit card required. Trial expires automatically after 14 days unless
              you choose to convert.
            </p>
          </div>

          <DemoRequestForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
