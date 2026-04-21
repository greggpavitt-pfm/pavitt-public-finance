"use client"
// src/components/sections/ContactSection.tsx  (v2 fintech — drop-in replacement)
//
// Light slate background. Left: intro + facts grid + LinkedIn.
// Right: white form card. Keeps the existing useActionState wiring.
import { useActionState } from "react"
import { sendContactEmail, type FormState } from "@/app/actions"
import { siteConfig } from "@/lib/content"
import { useReveal } from "@/lib/useReveal"

const initialState: FormState = { status: "idle", message: "" }

const FACTS: Array<[string, string]> = [
  ["Response time", "< 48 hours"],
  ["Availability", "Q1 2026"],
  ["Based", "Pacific / SSA"],
  ["Areas", "PFM Studies · IFMS · IPSAS · PIM · PEM · DRM"],
]

export default function ContactSection() {
  const [state, formAction, isPending] = useActionState(sendContactEmail, initialState)
  const reveal = useReveal<HTMLElement>()

  return (
    <section
      ref={reveal}
      id="contact"
      className="reveal-on-scroll border-t border-ink-200 bg-ink-50 px-6 py-24 md:px-12 md:py-[120px]"
    >
      <div className="mx-auto grid max-w-[1240px] gap-12 md:grid-cols-2 md:gap-16">
        {/* Left: intro */}
        <div>
          <p className="eyebrow">Get in Touch</p>
          <h2 className="mt-3 text-[clamp(28px,3.2vw,44px)] font-semibold leading-[1.1] tracking-[-0.028em] text-ink-900">
            Planning a PFM engagement?
          </h2>
          <p className="mt-4 max-w-[46ch] text-[17px] leading-[1.65] text-ink-700">
            Short-term diagnostics, long-term embedded roles, or a second opinion
            on a reform design — send a brief and Gregg will reply within two
            working days.
          </p>

          <a
            href={siteConfig.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ppf-sky hover:text-ppf-blue"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Connect on LinkedIn
          </a>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 rounded-md border border-ink-200 bg-white px-4 py-4">
            {FACTS.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-500">{k}</dt>
                <dd className="mt-0.5 text-sm font-medium tabular-nums text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right: form */}
        <div className="rounded-lg border border-ink-200 bg-white p-7">
          {state.status === "success" ? (
            <div className="rounded-md border border-success/25 bg-success-bg px-6 py-6">
              <div className="text-lg font-semibold tracking-[-0.015em] text-success-fg">
                Message sent.
              </div>
              <div className="mt-1 text-sm leading-[1.55] text-success-fg">
                {state.message}
              </div>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col">
              {state.status === "error" && (
                <p className="mb-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-[color:var(--danger)]">
                  {state.message}
                </p>
              )}

              <Field id="name" label="Your name" required>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Jane Smith"
                  className="w-full rounded-md border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 transition-shadow focus:border-ppf-sky focus:outline-none"
                />
              </Field>
              <Field id="email" label="Your email" required>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="jane@example.com"
                  className="w-full rounded-md border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-ppf-sky focus:outline-none"
                />
              </Field>
              <Field id="message" label="Project brief" required>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Scope, region, timing, donor, deliverables…"
                  className="w-full resize-y rounded-md border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-ppf-sky focus:outline-none"
                />
              </Field>
              <button
                type="submit"
                disabled={isPending}
                className="mt-5 inline-flex items-center justify-center gap-2 self-start rounded-md bg-ppf-sky px-5 py-2.5 text-sm font-medium text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover disabled:opacity-60"
              >
                {isPending ? "Sending…" : "Send message"}
                {!isPending && <span aria-hidden>→</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Field({
  id, label, required, children,
}: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="mt-3.5 block first:mt-0">
      <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.08em] text-ink-500">
        {label}{required && <span className="ml-0.5 text-ppf-sky">*</span>}
      </span>
      {children}
    </label>
  )
}
