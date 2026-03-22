"use client"
// Contact section — form + LinkedIn link
// Uses a React server action so the destination email stays server-side only.
import { useActionState } from "react"
import { sendContactEmail, type FormState } from "@/app/actions"
import { siteConfig } from "@/lib/content"

const initialState: FormState = { status: "idle", message: "" }

export default function ContactSection() {
  const [state, formAction, isPending] = useActionState(sendContactEmail, initialState)

  return (
    <section id="contact" className="bg-ppf-navy px-6 py-20 md:px-16">
      <div className="mx-auto max-w-3xl">
        {/* Section label */}
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-ppf-sky">
          Get in Touch
        </p>
        <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Contact</h2>

        {/* LinkedIn link */}
        <a
          href={siteConfig.linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-10 inline-flex items-center gap-2 text-ppf-sky hover:text-blue-300 transition-colors"
        >
          {/* LinkedIn icon (inline SVG — no extra dependency needed) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Connect on LinkedIn
        </a>

        {/* Success state */}
        {state.status === "success" ? (
          <div className="rounded-lg border border-green-500 bg-green-900/30 p-6 text-green-300">
            {state.message}
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-5">
            {/* Error message */}
            {state.status === "error" && (
              <p className="rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300">
                {state.message}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-blue-200">
                Your Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="rounded-md border border-ppf-blue/40 bg-ppf-navy px-4 py-3 text-white placeholder-blue-300/40 focus:border-ppf-sky focus:outline-none"
                placeholder="Jane Smith"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-blue-200">
                Your Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-md border border-ppf-blue/40 bg-ppf-navy px-4 py-3 text-white placeholder-blue-300/40 focus:border-ppf-sky focus:outline-none"
                placeholder="jane@example.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="message" className="text-sm font-medium text-blue-200">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className="rounded-md border border-ppf-blue/40 bg-ppf-navy px-4 py-3 text-white placeholder-blue-300/40 focus:border-ppf-sky focus:outline-none resize-none"
                placeholder="Tell Gregg about your project..."
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="self-start rounded-md bg-ppf-sky px-8 py-3 font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-60"
            >
              {isPending ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
