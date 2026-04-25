// /verify/[token] — public certificate verification page.
//
// No login required. Looks up an assessment_results row by verification_token
// via the public.verify_certificate RPC (SECURITY DEFINER). Returns 404 if
// the token doesn't exist, the result didn't pass, or the result was a
// practice attempt.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { createClient } from "@/lib/supabase/server"

interface PageProps {
  params: Promise<{ token: string }>
}

interface VerifiedCertificate {
  student_name: string
  org_name: string | null
  module_title: string
  score: number
  passed: boolean
  submitted_at: string
  attempt_number: number
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  return {
    title: `Verify Certificate — ${token.slice(0, 8)}…`,
    description: "Public verification of a Pavitt Public Finance training certificate.",
    robots: { index: false, follow: false },
  }
}

// Validate UUID format up-front so a junk URL doesn't hit Supabase
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { token } = await params

  if (!UUID_REGEX.test(token)) {
    notFound()
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("verify_certificate", { token })

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    notFound()
  }

  const cert: VerifiedCertificate = Array.isArray(data) ? data[0] : data

  const submittedDate = new Date(cert.submitted_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <>
      <Navbar />
      <main className="bg-ink-50">
        <section className="mx-auto max-w-[680px] px-6 pt-[140px] pb-16 md:pt-[160px] md:pb-24">
          <div className="rounded-lg border border-ppf-sky/30 bg-white p-8 shadow-crisp-md md:p-12">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-success-bg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-success-fg"
                  aria-hidden
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-success-fg">
                Verified Certificate
              </p>
            </div>

            <h1 className="mt-6 text-[clamp(22px,2.6vw,30px)] font-semibold leading-[1.2] tracking-[-0.018em] text-ink-900">
              {cert.module_title}
            </h1>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                  Awarded to
                </dt>
                <dd className="mt-1 text-[16px] font-semibold text-ink-900">
                  {cert.student_name || "—"}
                </dd>
              </div>
              {cert.org_name && (
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                    Organisation
                  </dt>
                  <dd className="mt-1 text-[16px] text-ink-900">{cert.org_name}</dd>
                </div>
              )}
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                  Score
                </dt>
                <dd className="mt-1 text-[16px] font-semibold tabular-nums text-ink-900">
                  {cert.score}%
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                  Date awarded
                </dt>
                <dd className="mt-1 text-[16px] tabular-nums text-ink-900">
                  {submittedDate}
                </dd>
              </div>
            </dl>

            <div className="mt-8 border-t border-ink-200 pt-5">
              <p className="text-[13px] leading-[1.6] text-ink-600">
                This certificate was issued by{" "}
                <span className="font-semibold text-ink-900">Pavitt Public Finance</span>{" "}
                via the IPSAS Training platform at{" "}
                <span className="font-mono">pfmexpert.net</span>. The unique token
                in this URL confirms the result has not been altered.
              </p>
              <p className="mt-3 font-mono text-[11px] tracking-[0.06em] text-ink-400 break-all">
                Token: {token}
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-[12px] text-ink-500">
            Hiring managers and donors can use this page to confirm a candidate&apos;s
            module completion. No login required.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}
