import type { Metadata } from "next"
import Image from "next/image"
import { images } from "@/lib/content"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"

export const metadata: Metadata = {
  title: "IPSAS Training — Pavitt Public Finance",
  description:
    "Interactive IPSAS training for public sector accountants. Practice questions across all accounting standards, plus an AI-powered resource for practitioners.",
}

// The two phases of the IPSAS training platform
const features = [
  {
    title: "Student Training",
    description:
      "Interactive practice questions covering all International Public Sector Accounting Standards. Log in, work through training modules at your own pace, and track your progress over time.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    title: "Practitioner Resource",
    description:
      "An AI-powered accounting assistant for working accountants in developing-country finance offices. Ask natural-language questions about IPSAS standards and get clear, contextual answers drawn from the full standards library.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
]

export default function IpsasTrainingPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero banner */}
        <section className="bg-ppf-navy px-6 py-20 md:px-16">
          <div className="mx-auto max-w-4xl text-center">
            <Image
              src={images.logoTransparent}
              alt="PPF Logo"
              width={192}
              height={192}
              className="mx-auto mb-6 h-48 w-auto"
            />
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ppf-sky">
              Coming Soon
            </p>
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              IPSAS Training Platform
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-blue-200/80 md:text-xl">
              Interactive training and an AI-powered accounting resource for public sector professionals working with International Public Sector Accounting Standards.
            </p>
          </div>
        </section>

        {/* Feature cards */}
        <section className="bg-white px-6 py-20 md:px-16">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-ppf-sky/20 bg-ppf-pale p-8"
                >
                  <div className="mb-4 text-ppf-sky">{feature.icon}</div>
                  <h2 className="mb-3 text-xl font-bold text-ppf-navy">
                    {feature.title}
                  </h2>
                  <p className="text-base leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it will work */}
        <section className="bg-ppf-light px-6 py-20 md:px-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center text-3xl font-bold text-ppf-navy">
              How It Works
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { step: "1", title: "Register", description: "Create your account to get started with personalised training." },
                { step: "2", title: "Learn", description: "Work through IPSAS training questions organised by accounting standard." },
                { step: "3", title: "Track", description: "Review your progress, revisit past questions, and build your expertise over time." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ppf-sky text-lg font-bold text-white">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-ppf-navy">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Register interest / notify me */}
        <section className="bg-ppf-navy px-6 py-20 md:px-16">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Get Notified at Launch
            </h2>
            <p className="mb-8 text-blue-200/80">
              Leave your email and we&apos;ll let you know when the IPSAS Training Platform is ready.
            </p>
            <form className="flex flex-col gap-3 sm:flex-row sm:gap-0">
              <input
                type="email"
                name="email"
                required
                placeholder="your@email.com"
                className="flex-1 rounded-md border border-ppf-blue/40 bg-ppf-navy px-4 py-3 text-white placeholder-blue-300/40 focus:border-ppf-sky focus:outline-none sm:rounded-r-none"
              />
              <button
                type="submit"
                className="rounded-md bg-ppf-sky px-6 py-3 font-semibold text-white transition-colors hover:bg-ppf-blue sm:rounded-l-none"
              >
                Notify Me
              </button>
            </form>
            <p className="mt-4 text-xs text-blue-300/50">
              No spam. We&apos;ll only email you about the IPSAS Training launch.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
