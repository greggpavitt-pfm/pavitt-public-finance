import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { images } from "@/lib/content"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"

export const metadata: Metadata = {
  title: "IPSAS Questions — Pavitt Public Finance",
  description:
    "AI-powered IPSAS advisor for public sector practitioners. Ask natural-language questions about IPSAS standards and get precise, cited answers.",
}

const features = [
  {
    title: "Ask IPSAS Questions",
    description:
      "Describe an accounting scenario or standard question in plain language. The advisor will identify the relevant IPSAS standards, provide cited guidance, and explain how the treatment applies to your entity's context.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
]

export default function IpsasQuestionsPage() {
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
              Practitioner Advisor
            </p>
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              IPSAS Questions
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-blue-200/80 md:text-xl">
              Ask natural-language questions about IPSAS standards and get precise,
              cited answers tailored to your entity&apos;s reporting context.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="w-full rounded-md bg-ppf-sky px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-ppf-blue sm:w-auto"
              >
                Register
              </Link>
              <Link
                href="/practitioner-login"
                className="w-full rounded-md border border-ppf-sky/50 px-8 py-3 text-base font-semibold text-blue-200 transition-colors hover:border-ppf-sky hover:text-white sm:w-auto"
              >
                Practitioner Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="bg-white px-6 py-20 md:px-16">
          <div className="mx-auto max-w-4xl">
            <div className="mx-auto max-w-lg">
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

        {/* How it works */}
        <section className="bg-ppf-light px-6 py-20 md:px-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center text-3xl font-bold text-ppf-navy">
              How It Works
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Register",
                  description: "Create your account, select your organisation and reporting context. Your account is reviewed before access is granted.",
                },
                {
                  step: "2",
                  title: "Set Context",
                  description: "Tell the advisor your jurisdiction, entity type, and reporting basis so answers are relevant to your specific situation.",
                },
                {
                  step: "3",
                  title: "Ask Questions",
                  description: "Describe your accounting scenario. The advisor identifies applicable standards, provides paragraph citations, and explains the treatment.",
                },
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

            {/* Bottom CTA */}
            <div className="mt-12 text-center">
              <Link
                href="/register"
                className="inline-block rounded-md bg-ppf-sky px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-ppf-blue"
              >
                Get Started
              </Link>
              <p className="mt-3 text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/practitioner-login" className="text-ppf-sky hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
