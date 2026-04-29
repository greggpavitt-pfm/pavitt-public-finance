// /lead-magnet — public landing page for the IPSAS adoption checklist.
// Email capture form → newsletter_signups table → checklist download.

import type { Metadata } from "next"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import LeadMagnetForm from "./LeadMagnetForm"

export const metadata: Metadata = {
  title: "Free download — IPSAS Adoption Checklist for MoF",
  description:
    "A practical 12-point checklist covering the steps a Ministry of Finance must complete before going live with accrual IPSAS. Free download.",
  alternates: { canonical: "/lead-magnet" },
}

const CHECKLIST_PREVIEW = [
  "Lock the data model — chart of accounts mapped to IPSAS line items before any system change.",
  "Inventory the standards in scope — first-time adoption uses IPSAS 33 plus the standards effective in your transition year.",
  "Identify exemptions you will use under IPSAS 33 — and the deadlines for closing each one.",
  "Capture the opening balance — measurement basis decided per asset class.",
  "Decide your transition disclosures — reconciliation from previous basis to IPSAS.",
  "Map your IFMIS to the new line items — including budget line mapping (IPSAS 24).",
  "Train preparers and reviewers — minimum 40 hours per finance officer.",
  "Document accounting policies — short-form policy manual approved by the CFO.",
  "Walk through one full reporting cycle in parallel — old basis and IPSAS side-by-side.",
  "Get audit pre-engagement — auditor sign-off on opening balances before going live.",
  "Set the cut-over date — and the date by which all amendments must be closed.",
  "Plan the post-implementation review — month 6 and month 12.",
]

export default function LeadMagnetPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <section className="border-b border-ink-200 bg-ppf-navy px-6 pt-[140px] pb-12 text-white md:px-12 md:pt-[160px] md:pb-16">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow text-white/60">Free download</p>
            <h1 className="mt-3 max-w-[26ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.05] tracking-[-0.025em]">
              IPSAS Adoption Checklist for Ministries of Finance
            </h1>
            <p className="mt-5 max-w-[58ch] text-[17px] leading-[1.6] text-white/80">
              A 12-point checklist covering the steps you must complete before
              going live with accrual IPSAS. Drawn from engagements across the
              Pacific and Sub-Saharan Africa.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1100px] gap-12 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:gap-16 md:px-8 md:py-24">
          {/* Preview */}
          <div>
            <h2 className="text-[clamp(20px,2.2vw,26px)] font-semibold tracking-[-0.018em] text-ink-900">
              What is in the checklist
            </h2>
            <ol className="mt-6 space-y-3">
              {CHECKLIST_PREVIEW.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-[15px] leading-[1.6] text-ink-800"
                >
                  <span
                    aria-hidden
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ppf-pale font-mono text-[11px] font-semibold text-ppf-blue"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Form */}
          <aside className="md:sticky md:top-[120px] md:self-start">
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-6 shadow-crisp-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ppf-blue">
                Get the download
              </p>
              <h3 className="mt-2 text-[18px] font-semibold tracking-[-0.012em] text-ink-900">
                Send me the checklist
              </h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-ink-600">
                Enter your email below. The download link appears immediately on
                this page. No follow-up unless you opt in.
              </p>

              <LeadMagnetForm />

              <p className="mt-4 text-[11px] leading-[1.5] text-ink-500">
                We use your email to send the download and, if you opt in,
                occasional practice notes. You can unsubscribe at any time. We
                never share or sell email addresses.
              </p>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  )
}
